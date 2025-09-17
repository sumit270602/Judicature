const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/summarize', auth, aiController.summarizeText);
router.post('/query', auth, aiController.legalQuery);
router.post('/extract-clauses', auth, upload.single('file'), aiController.extractClausesFromPDF);

module.exports = router; 