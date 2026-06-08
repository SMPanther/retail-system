const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/budget — current balance + history
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const [[balance]] = await pool.execute('SELECT * FROM vw_budget_balance');
    const [history]   = await pool.execute(
      'SELECT * FROM Store_Budget ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ balance, history });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/budget/deposit — add funds to budget
router.post('/deposit', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { amount, description } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be > 0' });
  try {
    await pool.execute(
      'INSERT INTO Store_Budget (amount, type, description, created_by) VALUES (?,?,?,?)',
      [amount, 'deposit', description || 'Budget deposit', req.user.username]
    );
    res.json({ message: 'Budget updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/budget/profit — profit summary
router.get('/profit', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const [[profit]]      = await pool.execute('SELECT * FROM vw_profit_summary');
    const [[budget]]      = await pool.execute('SELECT * FROM vw_budget_balance');
    const [topProfit]     = await pool.execute(`
      SELECT p.product_name, p.unit_price, p.cost_price,
             SUM(si.quantity) AS units_sold,
             SUM(si.quantity * si.unit_price) AS revenue,
             SUM(si.quantity * p.cost_price)  AS cost,
             SUM(si.quantity * (si.unit_price - p.cost_price)) AS profit
      FROM Sale_Item si JOIN Product p ON si.product_id = p.product_id
      GROUP BY p.product_id ORDER BY profit DESC LIMIT 10
    `);
    res.json({ profit, budget, topProfit });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
