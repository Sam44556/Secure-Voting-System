const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRoles = req.user.roles || [req.user.role];
        const normalizedUserRoles = (userRoles || []).map(r => (r || '').toLowerCase());
        const normalizedAllowed = allowedRoles.map(r => (r || '').toLowerCase());
        const hasRole = normalizedAllowed.some(role => normalizedUserRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({ error: 'Access denied: Unauthorized role' });
        }
        next();
    };
};

module.exports = { authenticate, authorizeRoles };
