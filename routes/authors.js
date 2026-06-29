const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, userOnly } = require('../middleware/auth');


router.get('/', verifyToken, userOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.[name], COUNT(b.id) AS total_books
      FROM users AS u
      LEFT JOIN books AS b ON u.id = b.author_id
      WHERE u.[role] = 'author'
      GROUP BY u.id, u.[name]
      ORDER BY u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifyToken, userOnly, async (req, res) => {
  try {
    const authorId = Number(req.params.id);
    
    // Check if the author exists and has the 'author' role
    const authorResult = await db.query(`
      SELECT id, [name], [role]
      FROM users
      WHERE id=? AND [role]='author'
    `, [authorId]);

    if (authorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Author not found!' });
    }

    const author = authorResult.rows[0];

    // Fetch all books written by this author
    const booksResult = await db.query(`
      SELECT b.id, b.book_name, b.price, b.created_at,
             b.photo_url, b.tags, b.number_of_pages, b.age_group, b.[language], b.isbn
      FROM books AS b
      WHERE b.author_id=?
      ORDER BY b.created_at DESC
    `, [authorId]);

    // Format tags of each book
    const books = booksResult.rows.map(row => ({
      ...row,
      tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
    }));

    res.json({
      id: author.id,
      name: author.name,
      books: books
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;