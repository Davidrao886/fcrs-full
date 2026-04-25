// controllers/authController.js — Signup and Login logic
// MIGRATED: MySQL → PostgreSQL (pg library)
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ── POST /signup ─────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password, role, bio } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required.' });
    }

    if (!['freelancer', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "freelancer" or "client".' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // CHANGED: ? → $1 for PostgreSQL parameterization
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // CHANGED: pg returns result.rows instead of destructured [rows]
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // CHANGED: Added RETURNING id (PostgreSQL style) instead of relying on insertId
    // CHANGED: $1..$5 placeholders instead of ?
    const result = await db.query(
      'INSERT INTO users (name, email, password, role, bio) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email.toLowerCase(), hashedPassword, role, bio || null]
    );

    // CHANGED: result.rows[0].id instead of result.insertId
    const userId = result.rows[0].id;

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase(), role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: userId, name, email, role }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
};

// ── POST /login ──────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // CHANGED: ? → $1 for PostgreSQL parameterization
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // CHANGED: pg returns result.rows
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

module.exports = { signup, login };
