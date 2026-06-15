const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, userOnly } = require('../middleware/auth');


router.post('/', verifyToken, userOnly, async (req, res) => {
  try {
    const { book_id, quantity } = req.body;
    const user_id = req.user.id;

    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity (positive integer)!' });
    }

    const book = await pool.query('SELECT * FROM books WHERE id=$1', [book_id]);
    if (book.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found!' });
    }

    const total_price = book.rows[0].price * quantity;

    const result = await pool.query(
      'INSERT INTO purchases (user_id, book_id, quantity, total_price) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, book_id, quantity, total_price]
    );

    res.status(201).json({
      success: true,
      message: 'Book purchased!',
      purchase: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/my', verifyToken, userOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.quantity, p.total_price, p.purchased_at,
             b.book_name, b.price, u.name as author_name
      FROM purchases p
      JOIN books b ON p.book_id = b.id
      JOIN users u ON b.author_id = u.id
      WHERE p.user_id = $1
      ORDER BY p.purchased_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;