const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.book_name, b.price, b.created_at,
             a.name as author_name, a.id as author_id
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, a.name as author_name 
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.id=$1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found!' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', verifyToken, async (req, res) => {
  try {
    const { book_name, price, author_id } = req.body;

    // check if the author exists
    const author = await pool.query(
      'SELECT * FROM authors WHERE id=$1', [author_id]
    );
    if (author.rows.length === 0) {
      return res.status(404).json({ message: 'Author not found!' });
    }

    const result = await pool.query(
      'INSERT INTO books (book_name, price, author_id) VALUES ($1, $2, $3) RETURNING *',
      [book_name, price, author_id]
    );

    // incraese author's total_book count
    await pool.query(
      'UPDATE authors SET total_books = total_books + 1 WHERE id=$1',
      [author_id]
    );

    res.status(201).json({ success: true, book: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { book_name, price, author_id } = req.body;

    const result = await pool.query(
      `UPDATE books SET book_name=$1, price=$2, author_id=$3 
       WHERE id=$4 RETURNING *`,
      [book_name, price, author_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found!' });
    }
    res.json({ success: true, book: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // first delete the book purchases
    await pool.query('DELETE FROM purchases WHERE book_id=$1', [id]);

    // delete the book now
    await pool.query('DELETE FROM books WHERE id=$1', [id]);

    res.json({ success: true, message: 'Book deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;