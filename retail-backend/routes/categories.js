const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Category ORDER BY category_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/categories
router.post('/', auth, async (req, res) => {
  const { category_name, description } = req.body;
  if (!category_name) return res.status(400).json({ error: 'category_name required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Category (category_name, description) VALUES (?,?)',
      [category_name, description||null]
    );
    res.status(201).json({ message: 'Category added', category_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
