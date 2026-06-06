const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/products — all products with category, supplier, stock (uses vw_product_details)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_product_details ORDER BY product_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/low-stock — uses vw_low_stock view
router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_low_stock');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM vw_product_details WHERE product_id = ?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products — add product
router.post('/', auth, async (req, res) => {
  const { category_id, supplier_id, product_name, description, unit_price, reorder_level } = req.body;
  if (!category_id || !supplier_id || !product_name || !unit_price)
    return res.status(400).json({ error: 'Missing required fields' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Product (category_id, supplier_id, product_name, description, unit_price, reorder_level) VALUES (?,?,?,?,?,?)',
      [category_id, supplier_id, product_name, description || null, unit_price, reorder_level || 10]
    );
    // Create inventory entry
    await pool.execute('INSERT INTO Inventory (product_id, quantity_in_stock) VALUES (?,?)', [result.insertId, 0]);
    res.status(201).json({ message: 'Product added', product_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/products/:id/restock — calls sp_restock_product
router.patch('/:id/restock', auth, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'quantity must be > 0' });
  try {
    await pool.execute('CALL sp_restock_product(?, ?)', [req.params.id, quantity]);
    res.json({ message: `Restocked ${quantity} units` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/products/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM Product WHERE product_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
