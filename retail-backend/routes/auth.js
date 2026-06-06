const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();
require('dotenv').config();

// Simple static auth for demo — no users table needed
const USERS = [
  { id: 1, username: 'admin',    password: 'admin123',  role: 'admin'   },
  { id: 2, username: 'manager',  password: 'manager123',role: 'manager' },
  { id: 3, username: 'cashier',  password: 'cashier123',role: 'cashier' },
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

module.exports = router;
