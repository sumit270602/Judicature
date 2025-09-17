const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

router.post('/', auth, upload.single('file'), uploadController.uploadFile);

module.exports = router; 