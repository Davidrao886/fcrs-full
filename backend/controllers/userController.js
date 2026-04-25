// controllers/userController.js — User profile and reputation
// MIGRATED: MySQL → PostgreSQL (pg library)
// UPDATED: Quoted table names ("Users", "Reviews", "Projects") → lowercase to match renamed schema
const db = require('../config/db');

// ── GET /user/:id ────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user with reputation stats — TABLE: users (lowercase, no quotes)
    const usersResult = await db.query(
      `SELECT id, name, email, role, bio, avatar_url,
              avg_rating, total_reviews, total_completed, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );
    const users = usersResult.rows;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];

    // Get reviews received by this user
    // TABLES: reviews, users, projects (all lowercase, no quotes)
    // Single self-contained template literal — WHERE and ORDER BY are
    // embedded directly, eliminating any risk of concatenation-gap bugs.
    const reviewsResult = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              reviewer.name AS reviewer_name,
              reviewer.role AS reviewer_role,
              p.title AS project_title
       FROM reviews r
       JOIN users reviewer ON reviewer.id = r.reviewer_id
       JOIN projects p ON p.id = r.project_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    const reviews = reviewsResult.rows;

    // Get projects for this user
    // TABLES: projects, users (all lowercase, no quotes)
    // OR split onto its own line for clarity; ORDER BY follows cleanly.
    const projectsResult = await db.query(
      `SELECT p.id, p.title, p.status, p.budget, p.created_at,
              c.name AS client_name,
              f.name AS freelancer_name,
              f.avg_rating AS freelancer_rating
       FROM projects p
       JOIN users c ON c.id = p.client_id
       LEFT JOIN users f ON f.id = p.freelancer_id
       WHERE p.client_id = $1
          OR p.freelancer_id = $2
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

    // TABLE: users (lowercase, no quotes)
    // Base query has no trailing whitespace — WHERE and ORDER BY
    // are each appended with an explicit leading space to prevent
    // token fusion ("...usersWHERE..." or "...$1ORDER BY...").
    let query = 'SELECT id, name, role, avg_rating, total_completed, bio FROM users';
    const params = [];

    if (role) {
      params.push(role);
      query += ` WHERE role = $${params.length}`;
    }

    // Leading space is explicit and unconditional.
    query += ' ORDER BY avg_rating DESC';

    const result = await db.query(query, params);
    const users = result.rows;

    res.json({ users });

  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
};

module.exports = { getUserProfile, listUsers };
