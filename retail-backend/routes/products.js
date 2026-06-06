const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_product_details ORDER BY product_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/low-stock
router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_low_stock');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_product_details WHERE product_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products — admin/manager only
router.post('/', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { category_id, supplier_id, product_name, description, unit_price, reorder_level } = req.body;
  if (!category_id || !supplier_id || !product_name || !unit_price)
    return res.status(400).json({ error: 'Missing required fields' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Product (category_id, supplier_id, product_name, description, unit_price, reorder_level) VALUES (?,?,?,?,?,?)',
      [category_id, supplier_id, product_name, description||null, unit_price, reorder_level||10]
    );
    await pool.execute('INSERT INTO Inventory (product_id, quantity_in_stock) VALUES (?,?)', [result.insertId, 0]);
    res.status(201).json({ message: 'Product added', product_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/products/:id/restock — admin/manager only, now accepts supplier_id
router.patch('/:id/restock', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { quantity, supplier_id } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'quantity must be > 0' });
  try {
    // Update product's supplier if a different one is chosen
    if (supplier_id) {
      await pool.execute('UPDATE Product SET supplier_id = ? WHERE product_id = ?', [supplier_id, req.params.id]);
    }
    // Use sp_restock_product stored procedure
    await pool.execute('CALL sp_restock_product(?, ?)', [req.params.id, quantity]);
    res.json({ message: `Restocked ${quantity} units` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const [result] = await pool.execute('DELETE FROM Product WHERE product_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
