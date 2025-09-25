const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Public routes - for clients to browse services
router.get('/categories', serviceController.getServiceCategories);
router.get('/category/:category', serviceController.getServicesByCategory);
router.get('/type/:serviceType', serviceController.getServicesByType);
router.get('/search', serviceController.searchServices);

// Protected routes - require authentication
router.use(auth);

// Lawyer-specific routes - require lawyer role
router.post('/', roles('lawyer'), serviceController.createService);
router.get('/my-services', roles('lawyer'), serviceController.getLawyerServices);
router.get('/lawyer/:lawyerId', serviceController.getLawyerServices);
router.put('/:serviceId', roles('lawyer'), serviceController.updateService);
router.delete('/:serviceId', roles('lawyer'), serviceController.deleteService);

module.exports = router;