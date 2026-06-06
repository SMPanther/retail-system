const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/sales — uses vw_sales_summary view
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_sales_summary ORDER BY sale_date DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/sales/:id — single sale with items
router.get('/:id', async (req, res) => {
  try {
    const [sale] = await pool.execute(`
      SELECT s.*, COALESCE(CONCAT(c.first_name,' ',c.last_name),'Guest') AS customer_name
      FROM Sale s LEFT JOIN Customer c ON s.customer_id = c.customer_id
      WHERE s.sale_id = ?`, [req.params.id]);
    if (!sale.length) return res.status(404).json({ error: 'Sale not found' });

    const [items] = await pool.execute(`
      SELECT si.*, p.product_name FROM Sale_Item si
      JOIN Product p ON si.product_id = p.product_id
      WHERE si.sale_id = ?`, [req.params.id]);

    res.json({ ...sale[0], items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/sales — create sale using sp_process_sale + sp_add_sale_item
router.post('/', auth, async (req, res) => {
  const { customer_id, items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'items are required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Call sp_process_sale
    const [saleResult] = await conn.execute(
      'INSERT INTO Sale (customer_id, sale_date, total_amount) VALUES (?, NOW(), 0)',
      [customer_id || null]
    );
    const sale_id = saleResult.insertId;

    // Add each item using sp_add_sale_item logic
    for (const item of items) {
      const { product_id, quantity } = item;

      const [prod] = await conn.execute('SELECT unit_price FROM Product WHERE product_id = ?', [product_id]);
      if (!prod.length) throw new Error(`Product ${product_id} not found`);

      const [inv] = await conn.execute('SELECT quantity_in_stock FROM Inventory WHERE product_id = ?', [product_id]);
      if (!inv.length || inv[0].quantity_in_stock < quantity)
        throw new Error(`Insufficient stock for product ${product_id}`);

      await conn.execute(
        'INSERT INTO Sale_Item (sale_id, product_id, quantity, unit_price) VALUES (?,?,?,?)',
        [sale_id, product_id, quantity, prod[0].unit_price]
      );

      await conn.execute(
        'UPDATE Inventory SET quantity_in_stock = quantity_in_stock - ? WHERE product_id = ?',
        [quantity, product_id]
      );
    }

    // Update total
    await conn.execute(
      'UPDATE Sale SET total_amount = (SELECT SUM(quantity*unit_price) FROM Sale_Item WHERE sale_id=?) WHERE sale_id=?',
      [sale_id, sale_id]
    );

    await conn.commit();
    res.status(201).json({ message: 'Sale created', sale_id });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
});

module.exports = router;
