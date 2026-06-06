const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/customers — uses vw_customer_spend view
router.get('/', async (req, res) => {
  try {
    const [all]  = await pool.execute('SELECT * FROM Customer ORDER BY registration_date DESC');
    const [spend]= await pool.execute('SELECT * FROM vw_customer_spend ORDER BY total_spent DESC');
    const spendMap = {};
    spend.forEach(s => { spendMap[s.customer_id] = s; });
    const merged = all.map(c => ({ ...c, ...( spendMap[c.customer_id] || { total_orders:0, total_spent:0 }) }));
    res.json(merged);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/customers/top — customers who spent above average
router.get('/top', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT customer_name, total_spent, total_orders, last_purchase
      FROM vw_customer_spend
      WHERE total_spent > (SELECT AVG(total_amount) FROM Sale WHERE customer_id IS NOT NULL)
      ORDER BY total_spent DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/customers
router.post('/', auth, async (req, res) => {
  const { first_name, last_name, email, phone, address } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ error: 'Name required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Customer (first_name, last_name, email, phone, address) VALUES (?,?,?,?,?)',
      [first_name, last_name, email||null, phone||null, address||null]
    );
    res.status(201).json({ message: 'Customer added', customer_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
