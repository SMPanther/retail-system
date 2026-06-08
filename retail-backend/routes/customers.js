const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    const [all]   = await pool.execute('SELECT * FROM Customer ORDER BY registration_date DESC');
    const [spend] = await pool.execute('SELECT * FROM vw_customer_spend ORDER BY total_spent DESC');
    const map = {};
    spend.forEach(s => { map[s.customer_id] = s; });
    res.json(all.map(c => ({ ...c, ...(map[c.customer_id] || { total_orders:0, total_spent:0 }) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/top', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT customer_name, total_spent, total_orders, last_purchase FROM vw_customer_spend
      WHERE total_spent > (SELECT AVG(total_amount) FROM Sale WHERE customer_id IS NOT NULL)
      ORDER BY total_spent DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/customers/:id/history — all sales with items for a customer
router.get('/:id/history', async (req, res) => {
  try {
    const [sales] = await pool.execute(`
      SELECT s.sale_id, s.sale_date, s.total_amount,
             COUNT(si.sale_item_id) AS item_count
      FROM Sale s JOIN Sale_Item si ON s.sale_id=si.sale_id
      WHERE s.customer_id=?
      GROUP BY s.sale_id ORDER BY s.sale_date DESC`, [req.params.id]);

    // Get items for each sale
    const result = await Promise.all(sales.map(async sale => {
      const [items] = await pool.execute(`
        SELECT si.quantity, si.unit_price, p.product_name, c.category_name
        FROM Sale_Item si
        JOIN Product p  ON si.product_id  = p.product_id
        JOIN Category c ON p.category_id  = c.category_id
        WHERE si.sale_id=?`, [sale.sale_id]);
      return { ...sale, items };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { first_name, last_name, email, phone, address } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ error: 'Name required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Customer (first_name,last_name,email,phone,address) VALUES (?,?,?,?,?)',
      [first_name, last_name, email||null, phone||null, address||null]
    );
    res.status(201).json({ message: 'Customer added', customer_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/settings/discount — get global discount
router.get('/settings/discount', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM Store_Settings WHERE setting_key='registered_customer_discount'"
    );
    res.json({ discount: rows.length ? Number(rows[0].setting_value) : 5 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/customers/settings/discount — update global discount
router.patch('/settings/discount', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { discount } = req.body;
  if (discount == null || discount < 0 || discount > 100)
    return res.status(400).json({ error: 'discount must be 0-100' });
  try {
    await pool.execute(`
      INSERT INTO Store_Settings (setting_key, setting_value, updated_by)
      VALUES ('registered_customer_discount', ?, ?)
      ON DUPLICATE KEY UPDATE setting_value=?, updated_by=?`,
      [String(discount), req.user.username, String(discount), req.user.username]
    );
    res.json({ message: 'Discount updated', discount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
