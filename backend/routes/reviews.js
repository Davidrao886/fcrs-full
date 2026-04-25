// routes/reviews.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { createReview, getUserReviews } = require('../controllers/reviewController');

router.post('/',          auth, createReview);
router.get('/:userId',    auth, getUserReviews);

module.exports = router;
