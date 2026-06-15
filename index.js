const express = require('express');
const pool = require('./db');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());


const authRouter = require('./routes/auth');
const authorsRouter = require('./routes/authors');
const booksRouter = require('./routes/books');
const purchasesRouter = require('./routes/purchases');

app.use('/api/auth', authRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/books', booksRouter);
app.use('/api/purchases', purchasesRouter);

// DB Test
pool.connect((err, client, release) => {
  if (err) console.log(' DB Failed:', err.message);
  else { console.log(' Neon DB Connected!'); release(); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});