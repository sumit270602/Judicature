
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { body } = require('express-validator');
const stripeConnectController = require('../controllers/stripeConnectController');

// Create Stripe Express account for lawyer (admin only)
router.post('/lawyers/:lawyerId/create-account',
  auth,
  roles(['admin']),
  stripeConnectController.createLawyerAccount
);

// Check account onboarding status
router.get('/lawyers/:lawyerId/account-status',
  auth,
  roles(['lawyer', 'admin']),
  stripeConnectController.checkAccountStatus
);

// Create new onboarding link
router.post('/lawyers/:lawyerId/onboarding-link',
  auth,
  roles(['lawyer', 'admin']),
  stripeConnectController.createOnboardingLink
);

// Get lawyer dashboard link
router.get('/lawyers/:lawyerId/dashboard-link',
  auth,
  roles(['lawyer', 'admin']),
  stripeConnectController.getDashboardLink
);

// Routes for current authenticated lawyer (used by frontend)
router.post('/create-account',
  auth,
  roles(['lawyer']),
  stripeConnectController.createAccount
);

router.get('/account-status',
  auth,
  roles(['lawyer']),
  stripeConnectController.getAccountStatus
);

router.post('/complete-onboarding',
  auth,
  roles(['lawyer']),
  stripeConnectController.completeOnboarding
);

module.exports = router;