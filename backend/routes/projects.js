// routes/projects.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  createProject, listProjects, completeProject, assignFreelancer
} = require('../controllers/projectController');

router.post('/',               auth, createProject);
router.get('/',                auth, listProjects);
router.patch('/:id/complete',  auth, completeProject);
router.patch('/:id/assign',    auth, assignFreelancer);

module.exports = router;
