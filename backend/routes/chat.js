const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Existing case chat history endpoint
router.get('/:caseId', auth, chatController.getChatHistory);

// Enhanced messaging endpoints
router.get('/messages/conversations', auth, chatController.getConversations);
router.get('/messages/conversation/:userId', auth, chatController.getConversation);
router.get('/messages/case/:caseId', auth, chatController.getCaseMessages);
router.post('/messages/direct', auth, chatController.sendDirectMessage);
router.get('/messages/unread-count', auth, chatController.getUnreadCount);

module.exports = router; 