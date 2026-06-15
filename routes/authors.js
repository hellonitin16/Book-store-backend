const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, userOnly } = require('../middleware/auth');


router.get('/', verifyToken, userOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, COUNT(b.id) as total_books
      FROM users u
      LEFT JOIN books b ON u.id = b.author_id
      WHERE u.role = 'author'
      GROUP BY u.id, u.name
      ORDER BY u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;