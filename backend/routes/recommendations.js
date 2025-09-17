const express = require('express');
const router = express.Router();
const { recommendLawyersForCase, getSimilarLawyers } = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// POST /api/recommendations/lawyers-for-case
// Get lawyer recommendations based on case type
router.post('/lawyers-for-case', auth, recommendLawyersForCase);

// GET /api/recommendations/similar-lawyers/:lawyerId
// Get similar lawyers based on a lawyer's profile
router.get('/similar-lawyers/:lawyerId', auth, getSimilarLawyers);

module.exports = router;