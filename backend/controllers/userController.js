// controllers/userController.js — User profile and reputation
const db = require('../config/db');

// ── GET /user/:id ────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user with reputation stats
    const [users] = await db.query(
      `SELECT id, name, email, role, bio, avatar_url,
              avg_rating, total_reviews, total_completed, created_at
       FROM Users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];

    // Get reviews received by this user
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              reviewer.name AS reviewer_name,
              reviewer.role AS reviewer_role,
              p.title AS project_title
       FROM Reviews r
       JOIN Users reviewer ON reviewer.id = r.reviewer_id
       JOIN Projects p ON p.id = r.project_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Get projects for this user
    const [projects] = await db.query(
      `SELECT p.id, p.title, p.status, p.budget, p.created_at,
              c.name AS client_name,
              f.name AS freelancer_name,
              f.avg_rating AS freelancer_rating
       FROM Projects p
       JOIN Users c ON c.id = p.client_id
       LEFT JOIN Users f ON f.id = p.freelancer_id
       WHERE p.client_id = ? OR p.freelancer_id = ?
       ORDER BY p.created_at DESC`,
      [userId, userId]
    );

    res.json({ user, reviews, projects });

  } catch (err) {
    console.error('getUserProfile error:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
};

// ── GET /users — List all users (for assigning freelancers) ──
const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, name, role, avg_rating, total_completed, bio FROM Users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    query += ' ORDER BY avg_rating DESC';

    const [users] = await db.query(query, params);
    res.json({ users });

  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
};

module.exports = { getUserProfile, listUsers };
