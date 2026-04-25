// controllers/projectController.js — Project CRUD operations
const db = require('../config/db');

// ── POST /project — Create a new project ────────────────────
const createProject = async (req, res) => {
  try {
    // Only clients can create projects
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can create projects.' });
    }

    const { title, description, budget, freelancer_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    // If freelancer_id provided, validate it exists and is a freelancer
    if (freelancer_id) {
      const [fl] = await db.query(
        "SELECT id FROM Users WHERE id = ? AND role = 'freelancer'",
        [freelancer_id]
      );
      if (fl.length === 0) {
        return res.status(400).json({ error: 'Invalid freelancer ID.' });
      }
    }

    const status = freelancer_id ? 'assigned' : 'open';

    const [result] = await db.query(
      `INSERT INTO Projects (title, description, budget, client_id, freelancer_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || null, budget || null, req.user.id, freelancer_id || null, status]
    );

    res.status(201).json({
      message: 'Project created successfully!',
      project_id: result.insertId
    });

  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ error: 'Server error creating project.' });
  }
};

// ── GET /projects — List projects ────────────────────────────
const listProjects = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT p.*, c.name AS client_name, c.avg_rating AS client_rating,
             f.name AS freelancer_name, f.avg_rating AS freelancer_rating
      FROM Projects p
      JOIN Users c ON c.id = p.client_id
      LEFT JOIN Users f ON f.id = p.freelancer_id
    `;
    const params = [];

    // Filter by logged-in user's projects
    const userId = req.user.id;
    const role   = req.user.role;
    if (role === 'client') {
      query += ' WHERE p.client_id = ?';
      params.push(userId);
    } else {
      query += ' WHERE p.freelancer_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const [projects] = await db.query(query, params);
    res.json({ projects });

  } catch (err) {
    console.error('listProjects error:', err);
    res.status(500).json({ error: 'Server error fetching projects.' });
  }
};

// ── PATCH /project/:id/complete — Mark project as completed ─
const completeProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    // Get the project
    const [rows] = await db.query('SELECT * FROM Projects WHERE id = ?', [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = rows[0];

    // Only the client who owns it can mark complete
    if (project.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project client can mark it complete.' });
    }

    if (project.status === 'completed') {
      return res.status(400).json({ error: 'Project is already completed.' });
    }

    if (project.status !== 'assigned') {
      return res.status(400).json({ error: 'Project must be assigned before completing.' });
    }

    await db.query(
      "UPDATE Projects SET status = 'completed', completed_at = NOW() WHERE id = ?",
      [projectId]
    );

    res.json({ message: 'Project marked as completed!' });

  } catch (err) {
    console.error('completeProject error:', err);
    res.status(500).json({ error: 'Server error completing project.' });
  }
};

// ── PATCH /project/:id/assign — Assign a freelancer ─────────
const assignFreelancer = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { freelancer_id } = req.body;

    const [rows] = await db.query('SELECT * FROM Projects WHERE id = ?', [projectId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found.' });

    const project = rows[0];
    if (project.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project client can assign freelancers.' });
    }

    // Validate freelancer
    const [fl] = await db.query(
      "SELECT id FROM Users WHERE id = ? AND role = 'freelancer'",
      [freelancer_id]
    );
    if (fl.length === 0) return res.status(400).json({ error: 'Invalid freelancer.' });

    await db.query(
      "UPDATE Projects SET freelancer_id = ?, status = 'assigned' WHERE id = ?",
      [freelancer_id, projectId]
    );

    res.json({ message: 'Freelancer assigned successfully!' });

  } catch (err) {
    console.error('assignFreelancer error:', err);
    res.status(500).json({ error: 'Server error assigning freelancer.' });
  }
};

module.exports = { createProject, listProjects, completeProject, assignFreelancer };
