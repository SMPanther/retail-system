const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/employees
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.*,
             CONCAT(e.first_name,' ',e.last_name) AS full_name,
             d.duty_name, d.department,
             da.shift, da.assigned_date, da.status AS duty_status,
             CONCAT(m.first_name,' ',m.last_name) AS manager_name
      FROM Employee e
      LEFT JOIN Duty_Assignment da ON e.employee_id = da.employee_id AND da.status = 'active'
      LEFT JOIN Duty d    ON da.duty_id    = d.duty_id
      LEFT JOIN Employee m ON da.assigned_by = m.employee_id
      ORDER BY e.role, e.first_name
    `);

    // Check which employees were paid this month
    const currentMonth = new Date().toLocaleString('en-US', { month:'long', year:'numeric' });
    const [paidThisMonth] = await pool.execute(`
      SELECT DISTINCT employee_id FROM Salary_Payment
      WHERE month_year = ?`, [currentMonth]);
    const paidSet = new Set(paidThisMonth.map(r => r.employee_id));

    res.json(rows.map(e => ({ ...e, paid_this_month: paidSet.has(e.employee_id) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/employees/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Employee WHERE employee_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
    const [payments] = await pool.execute(
      'SELECT * FROM Salary_Payment WHERE employee_id = ? ORDER BY payment_date DESC', [req.params.id]);
    const [duties] = await pool.execute(`
      SELECT da.*, d.duty_name, d.department, CONCAT(m.first_name,' ',m.last_name) AS assigned_by_name
      FROM Duty_Assignment da
      JOIN Duty d ON da.duty_id = d.duty_id
      JOIN Employee m ON da.assigned_by = m.employee_id
      WHERE da.employee_id = ? ORDER BY da.assigned_date DESC`, [req.params.id]);
    res.json({ ...rows[0], payments, duties });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/employees
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { first_name, last_name, email, phone, role, base_salary, join_date, address } = req.body;
  if (!first_name || !last_name || !role)
    return res.status(400).json({ error: 'first_name, last_name and role required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Employee (first_name,last_name,email,phone,role,base_salary,join_date,address) VALUES (?,?,?,?,?,?,?,?)',
      [first_name, last_name, email||null, phone||null, role, base_salary||0, join_date||null, address||null]
    );
    res.status(201).json({ message: 'Employee added', employee_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employees/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { status } = req.body;
  if (!['active','inactive'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await pool.execute('UPDATE Employee SET status=? WHERE employee_id=?', [status, req.params.id]);
    res.json({ message: `Employee marked ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/employees/:id
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    await pool.execute('DELETE FROM Employee WHERE employee_id=?', [req.params.id]);
    res.json({ message: 'Employee removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/employees/duties/list
router.get('/duties/list', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Duty ORDER BY department, duty_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/employees/:id/assign
router.post('/:id/assign', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { duty_id, shift, notes, manager_employee_id } = req.body;
  if (!duty_id || !manager_employee_id) return res.status(400).json({ error: 'duty_id and manager_employee_id required' });
  try {
    await pool.execute('CALL sp_assign_duty(?,?,?,?,?)',
      [req.params.id, duty_id, manager_employee_id, shift||'morning', notes||null]);
    res.json({ message: 'Duty assigned' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/employees/salary/summary
router.get('/salary/summary', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_salary_summary ORDER BY total_paid DESC');
    // Add paid_this_month flag
    const currentMonth = new Date().toLocaleString('en-US', { month:'long', year:'numeric' });
    const [paidThisMonth] = await pool.execute(
      'SELECT DISTINCT employee_id FROM Salary_Payment WHERE month_year = ?', [currentMonth]);
    const paidSet = new Set(paidThisMonth.map(r => r.employee_id));
    res.json(rows.map(e => ({ ...e, paid_this_month: paidSet.has(e.employee_id) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/employees/:id/pay
router.post('/:id/pay', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { amount, month_year, payment_method, notes } = req.body;
  if (!amount || !month_year) return res.status(400).json({ error: 'amount and month_year required' });

  // Prevent double payment for same month
  const [existing] = await pool.execute(
    'SELECT payment_id FROM Salary_Payment WHERE employee_id=? AND month_year=? AND amount > 0',
    [req.params.id, month_year]
  );
  if (existing.length) return res.status(409).json({ error: `Already paid for ${month_year}` });

  try {
    await pool.execute('CALL sp_pay_salary(?,?,?,?,?,?)',
      [req.params.id, amount, month_year, req.user.username, payment_method||'cash', notes||null]);
    res.json({ message: 'Salary paid' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
