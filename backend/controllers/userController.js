// controllers/userController.js — User profile and reputation
// MIGRATED: MySQL → PostgreSQL (pg library)
const db = require('../config/db');

// ── GET /user/:id ────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user with reputation stats
    const usersResult = await db.query(
      `SELECT id, name, email, role, bio, avatar_url,
              avg_rating, total_reviews, total_completed, created_at
       FROM "Users"
       WHERE id = $1`,
      [userId]
    );
    const users = usersResult.rows;

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];

    // Get reviews received by this user
    // FIX: Query is a single self-contained template literal.
    // Previously the WHERE clause and ORDER BY were appended via concatenation
    // without guaranteed spacing, risking "...project_idWHERE..." or
    // "...$1ORDER BY..." syntax errors. All clauses now live in one literal
    // with proper newline/space separation — no concatenation needed.
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
    // FIX: Same fix as above — single template literal keeps WHERE and
    // ORDER BY properly spaced and prevents any concatenation-gap bugs.
    const projectsResult = await db.query(
      `SELECT p.id, p.title, p.status, p.budget, p.created_at,
              c.name AS client_name,
              f.name AS freelancer_name,
              f.avg_rating AS freelancer_rating
       FROM "Projects" p
       JOIN "Users" c ON c.id = p.client_id
       LEFT JOIN "Users" f ON f.id = p.freelancer_id
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

    // FIX: Base query has no trailing whitespace.
    // The WHERE clause (if added) gets an explicit leading space so
    // "...\"Users\"WHERE..." can never happen.
    // ORDER BY also gets an explicit leading space so
    // "...$1ORDER BY..." or "...\"Users\"ORDER BY..." can never happen.
    let query = 'SELECT id, name, role, avg_rating, total_completed, bio FROM "Users"';
    const params = [];

    if (role) {
      params.push(role);
      query += ` WHERE role = $${params.length}`;
    }

    // FIX: Leading space is explicit and unconditional — ORDER BY is always
    // the last clause and always separated from whatever precedes it.
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
