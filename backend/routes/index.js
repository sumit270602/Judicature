const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/cases', require('./cases'));
router.use('/upload', require('./upload'));
router.use('/chat', require('./chat'));
router.use('/ai', require('./ai'));
router.use('/verification', require('./verification'));
router.use('/recommendations', require('./recommendations'));

module.exports = router; 