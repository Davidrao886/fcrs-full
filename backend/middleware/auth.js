// middleware/auth.js — JWT authentication middleware
const jwt = require('jsonwebtoken');

/**
 * Protects routes by verifying JWT tokens.
 * Attach this middleware to any route that requires a logged-in user.
 */
const authMiddleware = (req, res, next) => {
  // Get token from Authorization header: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
