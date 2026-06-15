const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;


    const userRole = role === 'author' ? 'author' : 'user';

    const existing = await pool.query(
      'SELECT * FROM users WHERE email=$1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
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

    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND role=$2', [email, role]
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