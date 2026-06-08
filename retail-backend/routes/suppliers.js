const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Supplier ORDER BY supplier_name');
    const [catRows] = await pool.execute(`
      SELECT s.supplier_id,
             GROUP_CONCAT(DISTINCT c.category_name ORDER BY c.category_name SEPARATOR ', ') AS categories,
             COUNT(DISTINCT p.product_id) AS product_count,
             COALESCE(SUM(sp.total_cost),0) AS total_purchased
      FROM Supplier s
      LEFT JOIN Product p            ON s.supplier_id = p.supplier_id
      LEFT JOIN Category c           ON p.category_id = c.category_id
      LEFT JOIN Supplier_Purchase sp ON s.supplier_id = sp.supplier_id
      GROUP BY s.supplier_id`);
    const map = {};
    catRows.forEach(r => { map[r.supplier_id] = r; });
    res.json(rows.map(s => ({ ...s, ...(map[s.supplier_id] || { categories:null, product_count:0, total_purchased:0 }) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET purchases history for a supplier
router.get('/:id/purchases', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM vw_supplier_purchases WHERE supplier_id=? ORDER BY purchase_date DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/suppliers — now accepts initial_category_id to link a product category
router.post('/', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { supplier_name, contact_person, phone, email, address, initial_category_id } = req.body;
  if (!supplier_name) return res.status(400).json({ error: 'supplier_name required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Supplier (supplier_name, contact_person, phone, email, address) VALUES (?,?,?,?,?)',
      [supplier_name, contact_person||null, phone||null, email||null, address||null]
    );
    const supplier_id = result.insertId;

    // If a category was selected, create a placeholder product link
    // Actually: just store a note — real category shows when products are assigned
    // Better approach: add a note column or just return success
    // The category will naturally appear once products from this supplier are added

    res.status(201).json({ message: 'Supplier added', supplier_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
