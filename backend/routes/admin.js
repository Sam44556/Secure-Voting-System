const express = require('express');
const router = express.Router();
const { getAllUsers, assignRole, getAuditLogs } = require('../controllers/adminController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Protected by authentication and Admin role
router.get('/users', authenticate, authorizeRoles('admin'), getAllUsers);
router.put('/users/:userId/role', authenticate, authorizeRoles('admin'), assignRole);
router.get('/audit-logs', authenticate, authorizeRoles('admin'), getAuditLogs);

module.exports = router;
