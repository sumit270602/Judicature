const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');
const auth = require('../middleware/auth');

// Google OAuth routes
router.get('/google', oauthController.initiateGoogleOAuth);
router.get('/google/callback', oauthController.googleCallback);

// Frontend-initiated Google OAuth verification
router.post('/google/verify', oauthController.verifyGoogleToken);

// Complete OAuth registration after role selection
router.post('/oauth/complete', auth, oauthController.completeOAuthRegistration);

module.exports = router;