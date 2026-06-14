const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'Missing JWT token' });
  }

  try {
    // Token verify 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // save user info in request 
    next();            
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token!' });
  }
};

module.exports = verifyToken;