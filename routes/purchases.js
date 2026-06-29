const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, userOnly } = require('../middleware/auth');


router.post('/', verifyToken, userOnly, async (req, res) => {
  try {
    const { book_id, quantity } = req.body;
    const user_id = req.user.id;

    const qtyVal = quantity !== undefined ? Number(quantity) : undefined;
    if (!qtyVal || !Number.isInteger(qtyVal) || qtyVal <= 0) {
      return res.status(400).json({ message: 'Valid quantity (positive integer)!' });
    }

    const book = await db.query('SELECT * FROM books WHERE id=?', [Number(book_id)]);
    if (book.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found!' });
    }

    const total_price = book.rows[0].price * qtyVal;

    const insertResult = await db.query(
      'INSERT INTO purchases (user_id, book_id, quantity, total_price) VALUES (?, ?, ?, ?)',
      [Number(user_id), Number(book_id), qtyVal, total_price]
    );

    // Fetch the inserted purchase
    const result = await db.query('SELECT * FROM purchases WHERE id=?', [insertResult.lastId]);

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
    const result = await db.query(`
      SELECT p.id, p.quantity, p.total_price, p.purchased_at,
             b.book_name, b.price, u.[name] AS author_name
      FROM (purchases AS p
      INNER JOIN books AS b ON p.book_id = b.id)
      INNER JOIN users AS u ON b.author_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.purchased_at DESC
    `, [Number(req.user.id)]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;