const express = require('express');
const router = express.Router();
const { getAllUsers, assignRole, getAuditLogs } = require('../controllers/adminController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// All routes here require Admin role (RBAC - Workflow 3)
router.use(authenticate);
router.use(authorizeRoles('Admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/role', assignRole);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
