const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

router.get('/', auth, roles('admin'), userController.getUsers);
router.get('/:id', auth, roles('admin'), userController.getUserById);
router.put('/:id', auth, roles('admin'), userController.updateUser);
router.delete('/:id', auth, roles('admin'), userController.deleteUser);

module.exports = router; 