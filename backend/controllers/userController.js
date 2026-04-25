// controllers/userController.js — User profile and reputation
// MIGRATED: MySQL → PostgreSQL (pg library)
const db = require('../config/db');

// ── GET /user/:id ────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user with reputation stats
    // CHANGED: [users] destructuring → result.rows pattern
    // CHANGED: ? → $1 for PostgreSQL parameterization
    // CHANGED: "Users" quoted to preserve case-sensitive table name
    const usersResult = await db.query(
      `SELECT id, name, email, role, bio, avatar_url,
              avg_rating, total_reviews, total_completed, created_at
       FROM "Users" WHERE id = $1`,
      [userId]
    );
    const users = usersResult.rows;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];

    // Get reviews received by this user
    // CHANGED: [reviews] destructuring → result.rows pattern
    // CHANGED: ? → $1 for PostgreSQL parameterization
    // CHANGED: Table names quoted to preserve case-sensitivity
    const reviewsResult = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              reviewer.name AS reviewer_name,
              reviewer.role AS reviewer_role,
              p.title AS project_title
       FROM "Reviews" r
       JOIN "Users" reviewer ON reviewer.id = r.reviewer_id
       JOIN "Projects" p ON p.id = r.project_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    const reviews = reviewsResult.rows;

    // Get projects for this user
    // CHANGED: [projects] destructuring → result.rows pattern
    // CHANGED: ? → $1, $2 for PostgreSQL parameterization
    // CHANGED: Table names quoted to preserve case-sensitivity
    const projectsResult = await db.query(
      `SELECT p.id, p.title, p.status, p.budget, p.created_at,
              c.name AS client_name,
              f.name AS freelancer_name,
              f.avg_rating AS freelancer_rating
       FROM "Projects" p
       JOIN "Users" c ON c.id = p.client_id
       LEFT JOIN "Users" f ON f.id = p.freelancer_id
       WHERE p.client_id = $1 OR p.freelancer_id = $2
       ORDER BY p.created_at DESC`,
      [userId, userId]
    );
    const projects = projectsResult.rows;

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

    // CHANGED: "Users" quoted to preserve case-sensitive table name
    let query = 'SELECT id, name, role, avg_rating, total_completed, bio FROM "Users"';
    const params = [];

    if (role) {
      // CHANGED: ? → $1 for PostgreSQL parameterization
      params.push(role);
      query += ` WHERE role = $${params.length}`;
    }
    query += ' ORDER BY avg_rating DESC';

    // CHANGED: [users] destructuring → result.rows pattern
    const result = await db.query(query, params);
    const users = result.rows;

    res.json({ users });

  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
};

module.exports = { getUserProfile, listUsers };
