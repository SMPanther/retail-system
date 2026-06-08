const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_product_details ORDER BY product_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.product_id, p.product_name, i.quantity_in_stock, p.reorder_level,
             s.supplier_name, s.phone AS supplier_phone
      FROM Product p JOIN Inventory i ON p.product_id=i.product_id
      JOIN Supplier s ON p.supplier_id=s.supplier_id
      WHERE i.quantity_in_stock <= p.reorder_level ORDER BY i.quantity_in_stock ASC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_product_details WHERE product_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { category_id, supplier_id, product_name, description, unit_price, cost_price, reorder_level } = req.body;
  if (!category_id || !supplier_id || !product_name || !unit_price)
    return res.status(400).json({ error: 'Missing required fields' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Product (category_id,supplier_id,product_name,description,unit_price,cost_price,reorder_level) VALUES (?,?,?,?,?,?,?)',
      [category_id, supplier_id, product_name, description||null, unit_price, cost_price||0, reorder_level||10]
    );
    await pool.execute('INSERT INTO Inventory (product_id,quantity_in_stock) VALUES (?,?)', [result.insertId, 0]);
    res.status(201).json({ message: 'Product added', product_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Edit product — price, cost, discounts
router.patch('/:id', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { product_name, unit_price, cost_price, description, reorder_level, category_id, supplier_id, discount_all, discount_registered } = req.body;
  try {
    await pool.execute(`
      UPDATE Product SET
        product_name        = COALESCE(?,product_name),
        unit_price          = COALESCE(?,unit_price),
        cost_price          = COALESCE(?,cost_price),
        description         = COALESCE(?,description),
        reorder_level       = COALESCE(?,reorder_level),
        category_id         = COALESCE(?,category_id),
        supplier_id         = COALESCE(?,supplier_id),
        discount_all        = COALESCE(?,discount_all),
        discount_registered = COALESCE(?,discount_registered)
      WHERE product_id=?`,
      [product_name||null, unit_price||null, cost_price||null, description||null,
       reorder_level||null, category_id||null, supplier_id||null,
       discount_all!=null?discount_all:null, discount_registered!=null?discount_registered:null,
       req.params.id]);
    res.json({ message: 'Product updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Restock — also creates supplier purchase record and deducts from budget
router.patch('/:id/restock', auth, async (req, res) => {
  if (req.user.role === 'cashier') return res.status(403).json({ error: 'Not authorized' });
  const { quantity, supplier_id, unit_cost, notes } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'quantity must be > 0' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update supplier if changed
    const effectiveSupplier = supplier_id;
    if (effectiveSupplier) {
      await conn.execute('UPDATE Product SET supplier_id=? WHERE product_id=?', [effectiveSupplier, req.params.id]);
    }

    // Get product info
    const [prod] = await conn.execute('SELECT * FROM Product WHERE product_id=?', [req.params.id]);
    if (!prod.length) throw new Error('Product not found');

    const costPerUnit = unit_cost || prod[0].cost_price || 0;
    const totalCost   = costPerUnit * quantity;
    const suppId      = effectiveSupplier || prod[0].supplier_id;

    // Record supplier purchase
    const [purchResult] = await conn.execute(
      'INSERT INTO Supplier_Purchase (supplier_id,product_id,quantity,unit_cost,total_cost,purchased_by,notes) VALUES (?,?,?,?,?,?,?)',
      [suppId, req.params.id, quantity, costPerUnit, totalCost, req.user.username, notes||null]
    );

    // Deduct from budget
    await conn.execute(
      'INSERT INTO Store_Budget (amount,type,description,reference_id,created_by) VALUES (?,?,?,?,?)',
      [-totalCost, 'purchase', `Restock: ${prod[0].product_name} x${quantity} from supplier`, purchResult.insertId, req.user.username]
    );

    // Update inventory using procedure
    await conn.execute('CALL sp_restock_product(?,?)', [req.params.id, quantity]);

    await conn.commit();
    res.json({ message: `Restocked ${quantity} units. Budget deducted: Rs. ${totalCost}` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const [result] = await pool.execute('DELETE FROM Product WHERE product_id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
