// controllers/disputeController.js — Dispute management
// MIGRATED: MySQL → PostgreSQL (pg library)
const db = require('../config/db');

// ── POST /dispute — Raise a dispute ─────────────────────────
const createDispute = async (req, res) => {
  try {
    const { project_id, reason } = req.body;
    const raised_by = req.user.id;

    if (!project_id || !reason) {
      return res.status(400).json({ error: 'project_id and reason are required.' });
    }

    // CHANGED: [rows] destructuring → result.rows pattern
    // CHANGED: ? → $1 for PostgreSQL parameterization
    // CHANGED: "Projects" quoted to preserve case-sensitive table name
    const projectResult = await db.query('SELECT * FROM "Projects" WHERE id = $1', [project_id]);
    const rows = projectResult.rows;

    if (rows.length === 0) return res.status(404).json({ error: 'Project not found.' });

    const project = rows[0];

    // Only project participants can raise disputes
    if (project.client_id !== raised_by && project.freelancer_id !== raised_by) {
      return res.status(403).json({ error: 'You are not a participant in this project.' });
    }

    // Check for duplicate dispute
    // CHANGED: ? → $1, $2 for PostgreSQL parameterization
    // CHANGED: "Disputes" quoted to preserve case-sensitive table name
    const existingResult = await db.query(
      'SELECT id FROM "Disputes" WHERE project_id = $1 AND raised_by = $2',
      [project_id, raised_by]
    );
    const existing = existingResult.rows;

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You already raised a dispute for this project.' });
    }

    // Update project status to disputed
    // CHANGED: ? → $1 for PostgreSQL parameterization
    await db.query("UPDATE \"Projects\" SET status = 'disputed' WHERE id = $1", [project_id]);

    // Insert dispute
    // CHANGED: ? → $1, $2, $3 for PostgreSQL parameterization
    // CHANGED: Added RETURNING id (PostgreSQL style) instead of relying on insertId
    const result = await db.query(
      'INSERT INTO "Disputes" (project_id, raised_by, reason) VALUES ($1, $2, $3) RETURNING id',
      [project_id, raised_by, reason]
    );

    // CHANGED: result.rows[0].id instead of result.insertId
    res.status(201).json({
      message: 'Dispute raised successfully.',
      dispute_id: result.rows[0].id
    });

  } catch (err) {
    // CHANGED: PostgreSQL uses '23505' for unique violation instead of MySQL's ER_DUP_ENTRY
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

    // CHANGED: [disputes] destructuring → result.rows pattern
    // CHANGED: ? → $1, $2 for PostgreSQL parameterization
    // CHANGED: Table names quoted to preserve case-sensitivity
    const result = await db.query(
      `SELECT d.*, p.title AS project_title, u.name AS raised_by_name
       FROM "Disputes" d
       JOIN "Projects" p ON p.id = d.project_id
       JOIN "Users" u ON u.id = d.raised_by
       WHERE p.client_id = $1 OR p.freelancer_id = $2
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
