const { pool } = require('../src/config/db');

exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.email,
                u.username,
                u.full_name,
                u.is_verified,
                u.is_active,
                u.created_at,
                COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users with roles', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.assignRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    console.log('Assigning role:', role, 'to user:', userId);

    if (!role) {
        return res.status(400).json({ error: 'Role name is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const roleResult = await client.query(
            'SELECT id, name FROM roles WHERE LOWER(name) = LOWER($1)',
            [role]
        );

        console.log('Role result:', roleResult.rows);

        if (roleResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Role ${role} does not exist` });
        }

        const userResult = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (roleResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Role ${role} does not exist` });
        }

        await client.query(
            `INSERT INTO user_roles (user_id, role_id, assigned_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, role_id)
             DO UPDATE SET assigned_at = EXCLUDED.assigned_at`,
            [userId, roleResult.rows[0].id]
        );

        console.log('Inserted user_role for user:', userId, 'role:', roleResult.rows[0].name);

        const rolesResult = await client.query(
            `SELECT COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
             FROM user_roles ur
             JOIN roles r ON ur.role_id = r.id
             WHERE ur.user_id = $1`,
            [userId]
        );

        console.log('User roles after assignment:', rolesResult.rows[0].roles);

        await client.query(
            `INSERT INTO audit_logs (event_type, user_id, description, success, ip_address, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'role_assignment',
                req.user.id,
                `Assigned role ${roleResult.rows[0].name} to user ${userId}`,
                true,
                req.ip,
                JSON.stringify({ targetUserId: userId, role: roleResult.rows[0].name })
            ]
        );

        await client.query('COMMIT');

        res.json({
            message: `Role ${roleResult.rows[0].name} assigned successfully`,
            roles: rolesResult.rows[0].roles
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error assigning role', err);
        res.status(500).json({ error: 'Failed to assign role' });
    } finally {
        client.release();
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.email as username 
            FROM audit_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY timestamp DESC LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};
