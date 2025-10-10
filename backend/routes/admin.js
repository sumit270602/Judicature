
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const verificationController = require('../controllers/verificationController');
const caseController = require('../controllers/caseController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Admin authentication middleware
const adminAuth = [auth, roles(['admin'])];

// ===== ADMIN OVERVIEW & ANALYTICS =====
router.get('/overview', adminAuth, adminController.getAdminOverview);
router.get('/analytics/users', adminAuth, adminController.getUserAnalytics);
router.get('/analytics/cases', adminAuth, adminController.getCaseAnalytics);
router.get('/analytics/financial', adminAuth, adminController.getFinancialAnalytics);
router.get('/system/health', adminAuth, adminController.getSystemHealth);
router.get('/activity/recent', adminAuth, adminController.getRecentActivity);

// ===== USER MANAGEMENT (Delegate to userController) =====
router.get('/users', adminAuth, userController.getUsers);
router.get('/users/:id', adminAuth, userController.getUserById);
router.get('/users/:id/details', adminAuth, userController.getUserDetails);
router.put('/users/:id', adminAuth, userController.updateUser);
router.delete('/users/:id', adminAuth, userController.deleteUser);
router.put('/users/:userId/status', adminAuth, adminController.toggleUserStatus);

// ===== LAWYER VERIFICATION =====
router.get('/verifications/pending', adminAuth, adminController.getPendingVerifications);
router.post('/verifications/:userId/approve', adminAuth, adminController.approveVerification);
router.post('/verifications/:userId/reject', adminAuth, adminController.rejectVerification);
router.get('/verifications/:lawyerId', adminAuth, verificationController.getVerificationDetails);
router.put('/verifications/:lawyerId/approve', adminAuth, verificationController.approveVerification);
router.put('/verifications/:lawyerId/reject', adminAuth, verificationController.rejectVerification);

// ===== VERIFICATION DOCUMENTS =====
router.get('/users/:userId/verification-documents', adminAuth, adminController.getUserVerificationDocuments);
router.get('/verification-documents/:documentId/download', adminAuth, adminController.downloadVerificationDocument);

// ===== CASE MANAGEMENT (Delegate to caseController) =====
router.get('/cases', adminAuth, caseController.getCases);
router.get('/cases/:id', adminAuth, caseController.getCaseById);
router.put('/cases/:id', adminAuth, caseController.updateCase);
router.delete('/cases/:id', adminAuth, caseController.deleteCase);

// ===== SERVICE MANAGEMENT =====
router.get('/services', adminAuth, adminController.getServices);
router.put('/services/:serviceId/status', adminAuth, adminController.updateServiceStatus);
router.delete('/services/:serviceId', adminAuth, adminController.deleteService);

// ===== PLATFORM NOTIFICATIONS =====
router.post('/announcements', adminAuth, adminController.createAnnouncement);
router.get('/notifications', adminAuth, adminController.getSystemNotifications);

module.exports = router;