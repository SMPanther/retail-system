const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Supplier ORDER BY supplier_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/suppliers
router.post('/', auth, async (req, res) => {
  const { supplier_name, contact_person, phone, email, address } = req.body;
  if (!supplier_name) return res.status(400).json({ error: 'supplier_name required' });
  try {
    const [result] = await pool.execute(
      'INSERT INTO Supplier (supplier_name, contact_person, phone, email, address) VALUES (?,?,?,?,?)',
      [supplier_name, contact_person||null, phone||null, email||null, address||null]
    );
    res.status(201).json({ message: 'Supplier added', supplier_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
