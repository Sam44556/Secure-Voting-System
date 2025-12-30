const db = require('../config/db');
const { logAudit } = require('../middleware/audit');

const getAllUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, role, is_email_verified, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

const assignRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['Admin', 'Election Officer', 'Voter', 'Auditor'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];

        await logAudit({
            user_id: req.user.id,
            username: req.user.username,
            action: 'ROLE_ASSIGNED',
            resource_type: 'USER',
            resource_id: user.id,
            status: 'SUCCESS',
            details: { assigned_role: role, target_username: user.username },
            ip_address: req.ip
        });

        res.json({ message: `Role ${role} assigned to ${user.username}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning role' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};

module.exports = { getAllUsers, assignRole, getAuditLogs };
