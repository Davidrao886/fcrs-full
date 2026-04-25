// routes/users.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getUserProfile, listUsers } = require('../controllers/userController');

router.get('/',    auth, listUsers);
router.get('/:id', auth, getUserProfile);

module.exports = router;
