const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if user already exists or not
    const existing = await pool.query(
      'SELECT * FROM users WHERE email=$1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered!' });
    }

    // encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // save into DB
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
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
    const { email, password } = req.body;

    // find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1', [email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const user = result.rows[0];

    // check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password!' });
    }

    // create JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true,
      message: 'Login successful!',
      token: token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;