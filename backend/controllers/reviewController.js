// controllers/reviewController.js — Review submission logic
// MIGRATED: MySQL → PostgreSQL (pg library)
// UPDATED: Quoted table names ("Projects", "Reviews", "Users") → lowercase to match renamed schema
const db = require('../config/db');

// ── POST /review — Submit a review ──────────────────────────
const createReview = async (req, res) => {
  try {
    const { project_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    // Validate inputs
    if (!project_id || !rating) {
      return res.status(400).json({ error: 'project_id and rating are required.' });
    }
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Get the project — TABLE: projects (lowercase, no quotes)
    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1',
      [project_id]
    );
    const rows = projectResult.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = rows[0];

    // Project must be completed before reviewing
    if (project.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed projects.' });
    }

    // Check reviewer is part of this project
    const isClient     = project.client_id    === reviewer_id;
    const isFreelancer = project.freelancer_id === reviewer_id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'You are not part of this project.' });
    }

    // Determine reviewee (you review the other party)
    const reviewee_id = isClient ? project.freelancer_id : project.client_id;

    if (!reviewee_id) {
      return res.status(400).json({ error: 'No valid reviewee for this project.' });
    }

    // Check for duplicate review — TABLE: reviews (lowercase, no quotes)
    const existingResult = await db.query(
      'SELECT id FROM reviews WHERE project_id = $1 AND reviewer_id = $2',
      [project_id, reviewer_id]
    );
    const existing = existingResult.rows;

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this project.' });
    }

    // Insert review — TABLE: reviews (lowercase, no quotes)
    // RETURNING id used instead of insertId (PostgreSQL style)
    // DB trigger updates avg_rating on the users table automatically
    const result = await db.query(
      `INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [project_id, reviewer_id, reviewee_id, ratingNum, comment || null]
    );

    res.status(201).json({
      message: 'Review submitted successfully!',
      review_id: result.rows[0].id
    });

  } catch (err) {
    // PostgreSQL unique violation code (replaces MySQL's ER_DUP_ENTRY)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already reviewed this project.' });
    }
    console.error('createReview error:', err);
    res.status(500).json({ error: 'Server error submitting review.' });
  }
};

// ── GET /reviews/:userId — Get reviews for a user ───────────
const getUserReviews = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // TABLES: reviews, users, projects (all lowercase, no quotes)
    // Single self-contained template literal — no concatenation,
    // no risk of spacing bugs between WHERE and ORDER BY.
    const result = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              reviewer.name AS reviewer_name,
              p.title AS project_title
       FROM reviews r
       JOIN users reviewer ON reviewer.id = r.reviewer_id
       JOIN projects p ON p.id = r.project_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    const reviews = result.rows;

    res.json({ reviews });

  } catch (err) {
    console.error('getUserReviews error:', err);
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
};

module.exports = { createReview, getUserReviews };
