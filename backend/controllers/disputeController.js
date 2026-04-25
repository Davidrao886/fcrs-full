// controllers/disputeController.js — Dispute management
// MIGRATED: MySQL → PostgreSQL (pg library)
// UPDATED: Quoted table names ("Projects", "Disputes", "Users") → lowercase to match renamed schema
const db = require('../config/db');

// ── POST /dispute — Raise a dispute ─────────────────────────
const createDispute = async (req, res) => {
  try {
    const { project_id, reason } = req.body;
    const raised_by = req.user.id;

    if (!project_id || !reason) {
      return res.status(400).json({ error: 'project_id and reason are required.' });
    }

    // TABLE: projects (lowercase, no quotes)
    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1',
      [project_id]
    );
    const rows = projectResult.rows;

    if (rows.length === 0) return res.status(404).json({ error: 'Project not found.' });

    const project = rows[0];

    // Only project participants can raise disputes
    if (project.client_id !== raised_by && project.freelancer_id !== raised_by) {
      return res.status(403).json({ error: 'You are not a participant in this project.' });
    }

    // Check for duplicate dispute
    // TABLE: disputes (lowercase, no quotes)
    const existingResult = await db.query(
      'SELECT id FROM disputes WHERE project_id = $1 AND raised_by = $2',
      [project_id, raised_by]
    );
    const existing = existingResult.rows;

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You already raised a dispute for this project.' });
    }

    // Update project status to disputed
    // TABLE: projects (lowercase, no quotes)
    await db.query(
      "UPDATE projects SET status = 'disputed' WHERE id = $1",
      [project_id]
    );

    // Insert dispute — RETURNING id for PostgreSQL
    // TABLE: disputes (lowercase, no quotes)
    const result = await db.query(
      'INSERT INTO disputes (project_id, raised_by, reason) VALUES ($1, $2, $3) RETURNING id',
      [project_id, raised_by, reason]
    );

    res.status(201).json({
      message: 'Dispute raised successfully.',
      dispute_id: result.rows[0].id
    });

  } catch (err) {
    // PostgreSQL unique violation code
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already raised a dispute for this project.' });
    }
    console.error('createDispute error:', err);
    res.status(500).json({ error: 'Server error raising dispute.' });
  }
};

// ── GET /disputes — Get disputes for the logged-in user ─────
const listDisputes = async (req, res) => {
  try {
    const userId = req.user.id;

    // TABLES: disputes, projects, users (all lowercase, no quotes)
    // OR condition uses $1 and $2 (same value) to avoid parameter reuse issues
    const result = await db.query(
      `SELECT d.*, p.title AS project_title, u.name AS raised_by_name
       FROM disputes d
       JOIN projects p ON p.id = d.project_id
       JOIN users u ON u.id = d.raised_by
       WHERE p.client_id = $1
          OR p.freelancer_id = $2
       ORDER BY d.created_at DESC`,
      [userId, userId]
    );
    const disputes = result.rows;

    res.json({ disputes });

  } catch (err) {
    console.error('listDisputes error:', err);
    res.status(500).json({ error: 'Server error fetching disputes.' });
  }
};

module.exports = { createDispute, listDisputes };
