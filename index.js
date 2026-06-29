const express = require('express');
const db = require('./db');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const authRouter = require('./routes/auth');
const authorsRouter = require('./routes/authors');
const booksRouter = require('./routes/books');
const purchasesRouter = require('./routes/purchases');

app.use('/api/auth', authRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/books', booksRouter);
app.use('/api/purchases', purchasesRouter);

// DB Test
db.connect((err) => {
  if (err) console.log(' DB Failed:', err.message);
  else { console.log(' MS Access DB Connected!'); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});