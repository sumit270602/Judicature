const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.get('/:caseId', auth, chatController.getChatHistory);

module.exports = router; 