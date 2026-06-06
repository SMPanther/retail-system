const express = require('express');
const pool    = require('../config/db');
const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    const [[products]]  = await pool.execute('SELECT COUNT(*) AS count FROM Product');
    const [[customers]] = await pool.execute('SELECT COUNT(*) AS count FROM Customer');
    const [[sales]]     = await pool.execute('SELECT COUNT(*) AS count FROM Sale');
    const [[revenue]]   = await pool.execute('SELECT COALESCE(SUM(total_amount),0) AS total FROM Sale');
    const [[suppliers]] = await pool.execute('SELECT COUNT(*) AS count FROM Supplier');

    // Low stock — explicit query matching vw_low_stock logic
    const [lowStock] = await pool.execute(`
      SELECT p.product_id, p.product_name, i.quantity_in_stock, p.reorder_level,
             s.supplier_name, s.phone AS supplier_phone
      FROM Product p
      JOIN Inventory i ON p.product_id = i.product_id
      JOIN Supplier s  ON p.supplier_id = s.supplier_id
      WHERE i.quantity_in_stock <= p.reorder_level
      ORDER BY i.quantity_in_stock ASC
    `);

    const [topCustomers]= await pool.execute('SELECT * FROM vw_customer_spend ORDER BY total_spent DESC LIMIT 5');
    const [salesSummary]= await pool.execute('SELECT * FROM vw_sales_summary ORDER BY sale_date DESC LIMIT 10');

    const [catRevenue] = await pool.execute(`
      SELECT c.category_name, SUM(si.quantity * si.unit_price) AS revenue
      FROM Sale_Item si
      JOIN Product p  ON si.product_id   = p.product_id
      JOIN Category c ON p.category_id   = c.category_id
      GROUP BY c.category_name ORDER BY revenue DESC
    `);

    const [topProducts] = await pool.execute(`
      SELECT p.product_name, SUM(si.quantity) AS total_sold,
             SUM(si.quantity * si.unit_price)  AS revenue
      FROM Sale_Item si JOIN Product p ON si.product_id = p.product_id
      GROUP BY p.product_name ORDER BY total_sold DESC LIMIT 5
    `);

    res.json({
      counts: {
        products:      products.count,
        customers:     customers.count,
        sales:         sales.count,
        suppliers:     suppliers.count,
        total_revenue: Number(revenue.total),
        low_stock:     lowStock.length,
      },
      lowStock,
      topCustomers,
      salesSummary,
      catRevenue,
      topProducts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
