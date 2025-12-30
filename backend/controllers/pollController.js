const { pool } = require('../src/config/db');

// CREATE POLL
exports.createPoll = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { title, description, election_type, start_time, end_time, region, classification, options } = req.body;
        const user_id = req.user.id;

        const result = await client.query(
            `INSERT INTO elections (title, description, election_type, start_time, end_time, region, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, description || '', election_type || 'General', start_time, end_time, region, user_id]
        );

        const pollId = result.rows[0].id;

        // Add Security Label (MAC)
        await client.query(
            `INSERT INTO security_labels (resource_type, resource_id, label, assigned_by)
             VALUES ('election', $1, $2, $3)`,
            [pollId, classification || 'public', user_id]
        );

        // Add Options
        if (options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                await client.query(
                    `INSERT INTO election_options (election_id, option_text, position)
                     VALUES ($1, $2, $3)`,
                    [pollId, options[i], i]
                );
            }
        }

        // Audit log
        await client.query(
            'INSERT INTO audit_logs (event_type, user_id, description, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
            ['ELECTION_CREATED', user_id, `Created election: ${title}`, JSON.stringify({ poll_id: pollId }), req.ip]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create election' });
    } finally {
        client.release();
    }
};

// GET ALL POLLS
exports.getPolls = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.*, u.username as owner_name, sl.label as classification 
            FROM elections e 
            JOIN users u ON e.created_by = u.id
            LEFT JOIN security_labels sl ON sl.resource_id = e.id AND sl.resource_type = 'election'
            ORDER BY e.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch elections' });
    }
};

// GET POLL BY ID
exports.getPollById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT e.*, sl.label as classification 
            FROM elections e 
            LEFT JOIN security_labels sl ON sl.resource_id = e.id AND sl.resource_type = 'election'
            WHERE e.id = $1
        `, [id]);

        if (result.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

        const options = await pool.query('SELECT * FROM election_options WHERE election_id = $1 ORDER BY position', [id]);

        res.json({ ...result.rows[0], options: options.rows });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// CAST VOTE
exports.castVote = async (req, res) => {
    try {
        const { pollId, optionId } = req.body;
        const user_id = req.user.id;

        const pollResult = await pool.query('SELECT * FROM elections WHERE id = $1', [pollId]);
        if (pollResult.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

        const poll = pollResult.rows[0];
        const now = new Date();
        if (now < new Date(poll.start_time) || now > new Date(poll.end_time)) {
            return res.status(403).json({ error: 'Voting is not currently open' });
        }

        await pool.query(
            'INSERT INTO votes (election_id, user_id, option_id, ip_address) VALUES ($1, $2, $3, $4)',
            [pollId, user_id, optionId, req.ip]
        );

        await pool.query(
            'INSERT INTO audit_logs (event_type, user_id, description, success) VALUES ($1, $2, $3, $4)',
            ['VOTE_CAST', user_id, `Cast vote in election ${pollId}`, true]
        );

        res.json({ message: 'Vote recorded successfully' });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Double voting detected' });
        console.error(err);
        res.status(500).json({ error: 'Failed to cast vote' });
    }
};

// PUBLISH RESULTS
exports.publishResults = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const poll = await pool.query('SELECT created_by FROM elections WHERE id = $1', [id]);
        if (poll.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

        if (poll.rows[0].created_by !== user_id && (!req.user.roles || !req.user.roles.includes('Admin'))) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query("UPDATE elections SET results_published = TRUE WHERE id = $1", [id]);
        res.json({ message: 'Results published successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Publish failed' });
    }
};

// GET RESULTS
exports.getResults = async (req, res) => {
    try {
        const { id } = req.params;
        const results = await pool.query(`
            SELECT eo.option_text, COUNT(v.id) as count
            FROM election_options eo
            LEFT JOIN votes v ON eo.id = v.option_id
            WHERE eo.election_id = $1
            GROUP BY eo.id
            ORDER BY eo.position
        `, [id]);
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch results' });
    }
};
