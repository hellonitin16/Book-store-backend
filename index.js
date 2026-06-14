const express = require('express');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

const authRouter = require('./routes/auth');
const authorsRouter = require('./routes/authors');
const booksRouter = require('./routes/books');
const purchasesRouter = require('./routes/purchases');

app.use('/api/auth', authRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/books', booksRouter);
app.use('/api/purchases', purchasesRouter);

// DB connect
pool.connect((err, client, release) => {
  if (err) {
    console.log('DB Failed:', err.message);
  } else { 
    console.log('Neon DB Connected!');
     release(); 
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port http://localhost:${process.env.PORT}`);
});
