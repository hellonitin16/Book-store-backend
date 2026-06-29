const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;


    const userRole = role === 'author' ? 'author' : 'user';

    const existing = await db.query(
      'SELECT * FROM users WHERE email=?', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // INSERT — no RETURNING in Access, use lastId + separate SELECT
    const insertResult = await db.query(
      'INSERT INTO users ([name], email, [password], [role]) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userRole]
    );

    const result = await db.query(
      'SELECT id, [name], email, [role] FROM users WHERE id=?', [insertResult.lastId]
    );

    res.status(201).json({
      success: true,
      message: 'Register successful!',
      user: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log(req.body);

    const result = await db.query(
      'SELECT * FROM users WHERE email=? AND [role]=?', [email, role]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `${role} not found!` });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: ' Wrong password!' });
    }

    // Token mein role bhi save karo
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token: token,
      role: user.role  // frontend ko batao role kya hai
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;