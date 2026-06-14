const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

// ✅ GET - Sabhi authors (public - koi bhi dekh sakta hai)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.name, COUNT(b.id) as total_books 
      FROM authors a
      LEFT JOIN books b ON a.id = b.author_id
      GROUP BY a.id
      ORDER BY a.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST - Author add karo (login zaroori)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO authors (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json({ success: true, author: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT - Author update karo (login zaroori)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      'UPDATE authors SET name=$1 WHERE id=$2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Author nahi mila!' });
    }
    res.json({ success: true, author: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE - Author delete karo (login zaroori)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM authors WHERE id=$1', [id]);
    res.json({ success: true, message: '✅ Author deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;