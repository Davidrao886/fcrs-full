// routes/disputes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { createDispute, listDisputes } = require('../controllers/disputeController');

router.post('/', auth, createDispute);
router.get('/',  auth, listDisputes);

module.exports = router;
