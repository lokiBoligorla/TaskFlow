const express = require('express');
const { signup, login, getMe, getAllUsers, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getAllUsers);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword); // Used for dropdowns when assigning tasks/members

module.exports = router;
