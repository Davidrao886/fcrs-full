// controllers/disputeController.js — Dispute management
const db = require('../config/db');

// ── POST /dispute — Raise a dispute ─────────────────────────
const createDispute = async (req, res) => {
  try {
    const { project_id, reason } = req.body;
    const raised_by = req.user.id;

    if (!project_id || !reason) {
      return res.status(400).json({ error: 'project_id and reason are required.' });
    }

    // Get the project
    const [rows] = await db.query('SELECT * FROM Projects WHERE id = ?', [project_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found.' });

    const project = rows[0];

    // Only project participants can raise disputes
    if (project.client_id !== raised_by && project.freelancer_id !== raised_by) {
      return res.status(403).json({ error: 'You are not a participant in this project.' });
    }

    // Check for duplicate dispute
    const [existing] = await db.query(
      'SELECT id FROM Disputes WHERE project_id = ? AND raised_by = ?',
      [project_id, raised_by]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You already raised a dispute for this project.' });
    }

    // Update project status to disputed
    await db.query("UPDATE Projects SET status = 'disputed' WHERE id = ?", [project_id]);

    // Insert dispute
    const [result] = await db.query(
      'INSERT INTO Disputes (project_id, raised_by, reason) VALUES (?, ?, ?)',
      [project_id, raised_by, reason]
    );

    res.status(201).json({
      message: 'Dispute raised successfully.',
      dispute_id: result.insertId
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
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

    const [disputes] = await db.query(
      `SELECT d.*, p.title AS project_title, u.name AS raised_by_name
       FROM Disputes d
       JOIN Projects p ON p.id = d.project_id
       JOIN Users u ON u.id = d.raised_by
       WHERE p.client_id = ? OR p.freelancer_id = ?
       ORDER BY d.created_at DESC`,
      [userId, userId]
    );

    res.json({ disputes });

  } catch (err) {
    console.error('listDisputes error:', err);
    res.status(500).json({ error: 'Server error fetching disputes.' });
  }
};

module.exports = { createDispute, listDisputes };
