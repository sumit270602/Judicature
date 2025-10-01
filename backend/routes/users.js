const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

router.get('/', auth, roles('admin'), userController.getUsers);
router.get('/:id', auth, roles('admin'), userController.getUserById);
router.put('/:id', auth, roles('admin'), userController.updateUser);
router.delete('/:id', auth, roles('admin'), userController.deleteUser);

// Profile management
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

// Notification settings
router.get('/notification-settings', auth, userController.getNotificationSettings);
router.put('/notification-settings', auth, userController.updateNotificationSettings);

// Lawyer profile management
router.put('/profile/lawyer/:id', auth, userController.updateLawyerProfile);
router.put('/profile/lawyer', auth, userController.updateLawyerProfile);

module.exports = router; 