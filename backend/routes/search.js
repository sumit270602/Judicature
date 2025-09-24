const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

// Global search endpoint
router.post('/global', auth, searchController.globalSearch);

// Search cases
router.post('/cases', auth, searchController.searchCases);

// Search documents
router.post('/documents', auth, searchController.searchDocuments);

// Search suggestions/autocomplete
router.get('/suggestions', auth, searchController.getSuggestions);

// Get recent searches
router.get('/recent', auth, searchController.getRecentSearches);

module.exports = router;