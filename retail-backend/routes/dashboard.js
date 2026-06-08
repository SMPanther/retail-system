const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const [[products]]  = await pool.execute('SELECT COUNT(*) AS count FROM Product');
    const [[customers]] = await pool.execute('SELECT COUNT(*) AS count FROM Customer');
    const [[sales]]     = await pool.execute('SELECT COUNT(*) AS count FROM Sale');
    const [[revenue]]   = await pool.execute('SELECT COALESCE(SUM(total_amount),0) AS total FROM Sale');
    const [[suppliers]] = await pool.execute('SELECT COUNT(*) AS count FROM Supplier');
    const [lowStock]    = await pool.execute(`
      SELECT p.product_id,p.product_name,i.quantity_in_stock,p.reorder_level,s.supplier_name,s.phone AS supplier_phone
      FROM Product p JOIN Inventory i ON p.product_id=i.product_id
      JOIN Supplier s ON p.supplier_id=s.supplier_id
      WHERE i.quantity_in_stock<=p.reorder_level ORDER BY i.quantity_in_stock ASC`);
    const [[profit]]    = await pool.execute('SELECT * FROM vw_profit_summary');
    const [[budget]]    = await pool.execute('SELECT * FROM vw_budget_balance');
    const [topCustomers]= await pool.execute('SELECT * FROM vw_customer_spend ORDER BY total_spent DESC LIMIT 5');
    const [salesSummary]= await pool.execute('SELECT * FROM vw_sales_summary ORDER BY sale_date DESC LIMIT 10');
    const [catRevenue]  = await pool.execute(`
      SELECT c.category_name,SUM(si.quantity*si.unit_price) AS revenue
      FROM Sale_Item si JOIN Product p ON si.product_id=p.product_id
      JOIN Category c ON p.category_id=c.category_id GROUP BY c.category_name ORDER BY revenue DESC`);
    const [topProducts] = await pool.execute(`
      SELECT p.product_name,SUM(si.quantity) AS total_sold,SUM(si.quantity*si.unit_price) AS revenue
      FROM Sale_Item si JOIN Product p ON si.product_id=p.product_id
      GROUP BY p.product_name ORDER BY total_sold DESC LIMIT 5`);
    res.json({ counts:{ products:products.count,customers:customers.count,sales:sales.count,
      suppliers:suppliers.count,total_revenue:Number(revenue.total),low_stock:lowStock.length },
      profit, budget, lowStock, topCustomers, salesSummary, catRevenue, topProducts,
      timestamp:new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/manager', auth, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Manager only' });
  try {
    const [lowStock] = await pool.execute(`
      SELECT p.product_id,p.product_name,i.quantity_in_stock,p.reorder_level,s.supplier_name,s.phone AS supplier_phone
      FROM Product p JOIN Inventory i ON p.product_id=i.product_id
      JOIN Supplier s ON p.supplier_id=s.supplier_id
      WHERE i.quantity_in_stock<=p.reorder_level ORDER BY i.quantity_in_stock ASC`);
    const [currentDuties] = await pool.execute(`
      SELECT e.employee_id,CONCAT(e.first_name,' ',e.last_name) AS employee_name,
             e.role,d.duty_name,d.department,da.shift,da.notes,
             CONCAT(m.first_name,' ',m.last_name) AS assigned_by_name
      FROM Employee e
      LEFT JOIN Duty_Assignment da ON e.employee_id=da.employee_id AND da.status='active'
      LEFT JOIN Duty d ON da.duty_id=d.duty_id
      LEFT JOIN Employee m ON da.assigned_by=m.employee_id
      WHERE e.status='active' ORDER BY e.role,e.first_name`);
    const [[empCount]]   = await pool.execute("SELECT COUNT(*) AS count FROM Employee WHERE status='active'");
    const [[assigned]]   = await pool.execute("SELECT COUNT(*) AS count FROM Duty_Assignment WHERE status='active'");
    const [[unassigned]] = await pool.execute(`
      SELECT COUNT(*) AS count FROM Employee e WHERE e.status='active'
      AND NOT EXISTS (SELECT 1 FROM Duty_Assignment da WHERE da.employee_id=e.employee_id AND da.status='active')`);
    res.json({ lowStock,currentDuties,
      counts:{ active_employees:empCount.count,assigned:assigned.count,unassigned:unassigned.count,low_stock:lowStock.length } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
