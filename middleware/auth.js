const jwt = require('jsonwebtoken');
require('dotenv').config();

// Token verify karo
const verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];
  console.log("token", token);
  if (!token) {
    return res.status(403).json({ message: '❌ Token nahi mila! Login karo pehle.' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: '❌ Token invalid hai!', err });
  }
};

//  Sirf Author access kar sakta hai
const authorOnly = (req, res, next) => {
  if (req.user.role !== 'author') {
    return res.status(403).json({ message: '❌ Sirf Authors ye kar sakte hai!' });
  }
  next();
};

// Sirf User access kar sakta hai
const userOnly = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: '❌ Sirf Users ye kar sakte hai!' });
  }
  next();
};

module.exports = { verifyToken, authorOnly, userOnly };