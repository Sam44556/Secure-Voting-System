const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/mfa-verify', authController.verifyMFA);
router.post('/refresh-token', authController.refreshToken);

// Protected routes (require authentication)
router.post('/enable-mfa', authenticate, authController.enableMFA);
router.post('/disable-mfa', authenticate, authController.disableMFA);

module.exports = router;
