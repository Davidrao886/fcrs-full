// controllers/reviewController.js — Review submission logic
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

    // Get the project
    const [rows] = await db.query('SELECT * FROM Projects WHERE id = ?', [project_id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = rows[0];

    // Project must be completed before reviewing
    if (project.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed projects.' });
    }

    // Check reviewer is part of this project
    const isClient     = project.client_id     === reviewer_id;
    const isFreelancer = project.freelancer_id  === reviewer_id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'You are not part of this project.' });
    }

    // Determine reviewee (you review the other party)
    const reviewee_id = isClient ? project.freelancer_id : project.client_id;

    if (!reviewee_id) {
      return res.status(400).json({ error: 'No valid reviewee for this project.' });
    }

    // Check for duplicate review (UNIQUE constraint will also catch this)
    const [existing] = await db.query(
      'SELECT id FROM Reviews WHERE project_id = ? AND reviewer_id = ?',
      [project_id, reviewer_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this project.' });
    }

    // Insert review (trigger will update reputation automatically)
    const [result] = await db.query(
      'INSERT INTO Reviews (project_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [project_id, reviewer_id, reviewee_id, ratingNum, comment || null]
    );

    res.status(201).json({
      message: 'Review submitted successfully!',
      review_id: result.insertId
    });

  } catch (err) {
    // Handle duplicate entry from DB UNIQUE constraint
    if (err.code === 'ER_DUP_ENTRY') {
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

    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              reviewer.name AS reviewer_name,
              p.title AS project_title
       FROM Reviews r
       JOIN Users reviewer ON reviewer.id = r.reviewer_id
       JOIN Projects p ON p.id = r.project_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({ reviews });

  } catch (err) {
    console.error('getUserReviews error:', err);
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
};

module.exports = { createReview, getUserReviews };
