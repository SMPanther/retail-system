const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/suppliers — with their product categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Supplier ORDER BY supplier_name');
    // Get categories per supplier
    const [catRows] = await pool.execute(`
      SELECT s.supplier_id, GROUP_CONCAT(DISTINCT c.category_name ORDER BY c.category_name SEPARATOR ', ') AS categories,
             COUNT(DISTINCT p.product_id) AS product_count
      FROM Supplier s
      LEFT JOIN Product p ON s.supplier_id = p.supplier_id
      LEFT JOIN Category c ON p.category_id = c.category_id
      GROUP BY s.supplier_id
    `);
    const catMap = {};
    catRows.forEach(r => { catMap[r.supplier_id] = { categories: r.categories, product_count: r.product_count }; });
    const merged = rows.map(s => ({ ...s, ...( catMap[s.supplier_id] || { categories: null, product_count: 0 }) }));
    res.json(merged);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/suppliers
router.post('/', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { supplier_name, contact_person, phone, email, address } = req.body;
  if (!supplier_name) return res.status(400).json({ error: 'supplier_name required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Supplier (supplier_name, contact_person, phone, email, address) VALUES (?,?,?,?,?)',
      [supplier_name, contact_person||null, phone||null, email||null, address||null]
    );
    res.status(201).json({ message: 'Supplier added', supplier_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
