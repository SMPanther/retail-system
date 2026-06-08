const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/sales — all or filter by date
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (date) {
      const [rows] = await pool.execute(`
        SELECT vs.*, DATE(vs.sale_date) AS sale_day
        FROM vw_sales_summary vs
        WHERE DATE(vs.sale_date) = ?
        ORDER BY vs.sale_date DESC`, [date]);
      res.json(rows);
    } else {
      const [rows] = await pool.execute('SELECT * FROM vw_sales_summary ORDER BY sale_date DESC');
      res.json(rows);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/sales/daily — daily summary for date picker
router.get('/daily', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vw_daily_sales ORDER BY sale_day DESC LIMIT 60');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [sale] = await pool.execute(`
      SELECT s.*, COALESCE(CONCAT(c.first_name,' ',c.last_name),'Guest') AS customer_name,
             CASE WHEN s.customer_id IS NOT NULL THEN 1 ELSE 0 END AS is_registered
      FROM Sale s LEFT JOIN Customer c ON s.customer_id=c.customer_id
      WHERE s.sale_id=?`, [req.params.id]);
    if (!sale.length) return res.status(404).json({ error: 'Sale not found' });
    const [items] = await pool.execute(`
      SELECT si.*, p.product_name FROM Sale_Item si
      JOIN Product p ON si.product_id=p.product_id WHERE si.sale_id=?`, [req.params.id]);
    res.json({ ...sale[0], items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admin cannot process sales' });
  const { customer_id, items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'items required' });

  // Get global discount setting
  const [discSetting] = await pool.execute(
    "SELECT setting_value FROM Store_Settings WHERE setting_key='registered_customer_discount'"
  );
  const BASE_REG_DISCOUNT = discSetting.length ? Number(discSetting[0].setting_value) / 100 : 0.05;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const isRegistered = !!customer_id;
    const [saleResult] = await conn.execute(
      'INSERT INTO Sale (customer_id,sale_date,total_amount) VALUES (?,NOW(),0)', [customer_id||null]
    );
    const sale_id = saleResult.insertId;
    let subtotal = 0;

    for (const item of items) {
      const { product_id, quantity } = item;
      const [prod] = await conn.execute(
        'SELECT unit_price,discount_all,discount_registered FROM Product WHERE product_id=?', [product_id]
      );
      if (!prod.length) throw new Error(`Product ${product_id} not found`);
      const [inv] = await conn.execute('SELECT quantity_in_stock FROM Inventory WHERE product_id=?', [product_id]);
      if (!inv.length || inv[0].quantity_in_stock < quantity)
        throw new Error(`Insufficient stock for product ${product_id}`);

      const discAll = parseFloat(prod[0].discount_all || 0) / 100;
      const discReg = isRegistered ? (parseFloat(prod[0].discount_registered || 0) / 100 + BASE_REG_DISCOUNT) : 0;
      const totalDisc = Math.min(discAll + discReg, 0.9);
      const finalPrice = parseFloat((prod[0].unit_price * (1 - totalDisc)).toFixed(2));

      await conn.execute(
        'INSERT INTO Sale_Item (sale_id,product_id,quantity,unit_price) VALUES (?,?,?,?)',
        [sale_id, product_id, quantity, finalPrice]
      );
      await conn.execute(
        'UPDATE Inventory SET quantity_in_stock=quantity_in_stock-? WHERE product_id=?', [quantity, product_id]
      );
      subtotal += finalPrice * quantity;
    }

    await conn.execute('UPDATE Sale SET total_amount=? WHERE sale_id=?', [subtotal.toFixed(2), sale_id]);
    await conn.commit();
    res.status(201).json({ message: 'Sale created', sale_id, total: subtotal.toFixed(2) });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
});

module.exports = router;
