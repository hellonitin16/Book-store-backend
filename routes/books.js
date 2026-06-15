const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, authorOnly } = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.book_name, b.price, b.created_at,
             b.photo_url, b.tags, b.number_of_pages, b.age_group, b.language,
             u.name as author_name, u.id as author_id
      FROM books b
      LEFT JOIN users u ON b.author_id = u.id
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
      SELECT b.*, u.name as author_name
      FROM books b
      LEFT JOIN users u ON b.author_id = u.id
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


router.post('/', verifyToken, authorOnly, async (req, res) => {
  try {
    const { book_name, price, photo_url, tags, number_of_pages, age_group, language } = req.body;
    const author_id = req.user.id;

    if (!book_name || price === undefined) {
      return res.status(400).json({ message: 'book name and price are required!' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative!' });
    }

    const pagesVal = number_of_pages ? parseInt(number_of_pages) : null;
    const tagsArr = Array.isArray(tags) ? tags : null;

    const result = await pool.query(
      `INSERT INTO books (book_name, price, author_id, photo_url, tags, number_of_pages, age_group, language) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [book_name, price, author_id, photo_url || null, tagsArr, pagesVal, age_group || null, language || null]
    );

    res.status(201).json({ success: true, book: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:id', verifyToken, authorOnly, async (req, res) => {
  try {
    const { book_name, price, photo_url, tags, number_of_pages, age_group, language } = req.body;
    const author_id = req.user.id;

    if (!book_name || price === undefined) {
      return res.status(400).json({ message: 'book name and price are required!' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative!' });
    }


    const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found!' });
    }

    if (bookCheck.rows[0].author_id !== author_id) {
      return res.status(403).json({ message: 'You can only update your own books!' });
    }

    const pagesVal = number_of_pages ? parseInt(number_of_pages) : null;
    const tagsArr = Array.isArray(tags) ? tags : null;

    const result = await pool.query(
      `UPDATE books 
       SET book_name=$1, price=$2, photo_url=$3, tags=$4, number_of_pages=$5, age_group=$6, language=$7 
       WHERE id=$8 RETURNING *`,
      [book_name, price, photo_url || null, tagsArr, pagesVal, age_group || null, language || null, req.params.id]
    );

    res.json({ success: true, book: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', verifyToken, authorOnly, async (req, res) => {
  try {
    const author_id = req.user.id;


    const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found!' });
    }

    if (bookCheck.rows[0].author_id !== author_id) {
      return res.status(403).json({ message: 'You can only delete your own books!' });
    }


    await pool.query('DELETE FROM purchases WHERE book_id=$1', [req.params.id]);
    await pool.query('DELETE FROM books WHERE id=$1', [req.params.id]);

    res.json({ success: true, message: 'Book deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.rating, r.review_text, r.created_at, u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.book_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/:id/reviews', verifyToken, async (req, res) => {
  try {
    const { rating } = req.body;
    const user_id = req.user.id;
    const book_id = req.params.id;

    if (!rating) {
      return res.status(400).json({ message: 'Rating is required.' });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }


    const bookCheck = await pool.query('SELECT * FROM books WHERE id = $1', [book_id]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (book_id, user_id, rating) VALUES ($1, $2, $3) RETURNING *',
      [book_id, user_id, ratingNum]
    );


    const response = {
      ...result.rows[0],
      reviewer_name: req.user.name
    };

    res.status(201).json({ success: true, review: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 