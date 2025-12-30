const db = require('../config/db');

// RuBAC: Rule-Based (Time-bound voting window)
const checkRuBAC = async (req, res, next) => {
    const pollId = req.body.poll_id || req.params.id;
    if (!pollId) return next();

    try {
        const result = await db.query('SELECT start_time, end_time FROM polls WHERE id = $1', [pollId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        const { start_time, end_time } = result.rows[0];
        const now = new Date();

        if (now < new Date(start_time)) {
            return res.status(403).json({ message: 'Access denied: Voting has not started pulse yet' });
        }
        if (now > new Date(end_time)) {
            return res.status(403).json({ message: 'Access denied: Voting period has ended' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking timeline rules' });
    }
};

// ABAC: Attribute-Based (Matching voter attributes with poll requirements)
const checkABAC = async (req, res, next) => {
    const pollId = req.body.poll_id || req.params.id;
    const user = req.user;

    if (!pollId) return next();

    try {
        const result = await db.query('SELECT required_age, required_region FROM polls WHERE id = $1', [pollId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        const poll = result.rows[0];

        // 1. Check Age
        if (poll.required_age && user.age < poll.required_age) {
            return res.status(403).json({ message: `Access denied: Minimum age requirement is ${poll.required_age}` });
        }

        // 2. Check Region
        if (poll.required_region && user.region !== poll.required_region) {
            return res.status(403).json({ message: `Access denied: This poll is restricted to the ${poll.required_region} region` });
        }

        // 3. Check Verification
        if (!user.is_email_verified) {
            return res.status(403).json({ message: 'Access denied: Your account must be verified to vote' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking attribute-based rules' });
    }
};

// DAC: Record Level Ownership check
const authorizeDAC = (resourceType, permissionRequired = 'VIEW') => {
    return async (req, res, next) => {
        const resourceId = req.params.id;
        const userId = req.user.id;

        try {
            // 1. Check if user is the direct owner
            let ownerCheck;
            if (resourceType === 'POLL') {
                ownerCheck = await db.query('SELECT owner_id FROM polls WHERE id = $1', [resourceId]);
            }

            if (ownerCheck?.rows[0]?.owner_id === userId) {
                return next();
            }

            // 2. Check explicitly granted permissions (poll_permissions table)
            const permCheck = await db.query(
                'SELECT permission_type FROM poll_permissions WHERE poll_id = $1 AND user_id = $2',
                [resourceId, userId]
            );

            const userPerms = permCheck.rows.map(r => r.permission_type);

            if (userPerms.includes(permissionRequired) || userPerms.includes('MANAGE')) {
                return next();
            }

            // 3. Fallback for Admins
            if (req.user.role === 'Admin') {
                return next();
            }

            return res.status(403).json({ message: 'Access denied: You do not have permission for this record' });
        } catch (error) {
            res.status(500).json({ message: 'Error checking record permissions' });
        }
    };
};

module.exports = { checkRuBAC, checkABAC, authorizeDAC };
