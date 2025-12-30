const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB to check for lockout, role change, etc.
        const result = await db.query(
            'SELECT id, username, role, clearance_level, department, location, lockout_until FROM users WHERE id = $1',
            [decoded.id]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        // Check for account lockout
        if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
            return res.status(403).json({ message: 'Account is temporarily locked' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// RBAC: Role Checking
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role (${req.user.role}) is not authorized to access this resource`
            });
        }
        next();
    };
};

// MAC: Clearance Level Checking
const authorizeClearance = (requiredLevel) => {
    const levels = { 'Public': 1, 'Internal': 2, 'Confidential': 3 };
    return (req, res, next) => {
        const userLevel = levels[req.user.clearance_level] || 1;
        const required = levels[requiredLevel] || 1;

        if (userLevel < required) {
            return res.status(403).json({
                message: 'Access denied: Insufficient security clearance level'
            });
        }
        next();
    };
};

module.exports = { authenticate, authorizeRoles, authorizeClearance };
