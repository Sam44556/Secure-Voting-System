const db = require('../config/db');
const { logAudit } = require('../middleware/audit');

const createPoll = async (req, res) => {
    const { title, description, sensitivity_level, start_time, end_time, required_age, required_region } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO polls (title, description, owner_id, sensitivity_level, start_time, end_time, required_age, required_region) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, description, req.user.id, sensitivity_level || 'Public', start_time, end_time, required_age || 18, required_region]
        );

        const poll = result.rows[0];

        await logAudit({
            user_id: req.user.id,
            username: req.user.username,
            action: 'POLL_CREATED',
            resource_type: 'POLL',
            resource_id: poll.id,
            status: 'SUCCESS',
            details: { title: poll.title },
            ip_address: req.ip
        });

        res.status(201).json(poll);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating poll' });
    }
};

const getPolls = async (req, res) => {
    try {
        const user = req.user;

        // Filter by MAC (Clearance) and ABAC (Age, Region)
        // Voter should only see polls they are eligible for
        const result = await db.query(
            `SELECT p.* FROM polls p
             WHERE p.is_active = TRUE
             AND (p.required_age IS NULL OR p.required_age <= $1)
             AND (p.required_region IS NULL OR p.required_region = $2)
             ORDER BY p.start_time DESC`,
            [user.age || 0, user.region]
        );

        // Further filter by MAC in code for simplicity or use complex SQL
        const levels = { 'Public': 1, 'Internal': 2, 'Confidential': 3 };
        const userLevel = levels[user.clearance_level] || 1;

        const filtered = result.rows.filter(p => levels[p.sensitivity_level] <= userLevel);

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching polls' });
    }
};

const castVote = async (req, res) => {
    const { pollId, voteData } = req.body;
    const ip = req.ip;

    try {
        // Double voting prevention is handled by DB unique constraint
        await db.query(
            'INSERT INTO votes (user_id, poll_id, vote_data, ip_address) VALUES ($1, $2, $3, $4)',
            [req.user.id, pollId, voteData, ip]
        );

        await logAudit({
            user_id: req.user.id,
            username: req.user.username,
            action: 'VOTE_CAST',
            resource_type: 'POLL',
            resource_id: pollId,
            status: 'SUCCESS',
            ip_address: req.ip
        });

        res.status(201).json({ message: 'Vote recorded successfully' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'You have already voted in this poll' });
        }
        res.status(500).json({ message: 'Error casting vote' });
    }
};

const publishResults = async (req, res) => {
    const { id } = req.params;
    try {
        // Workflow 6: Update sensitivity level from Internal/Confidential to Public
        await db.query(
            "UPDATE polls SET sensitivity_level = 'Public' WHERE id = $1",
            [id]
        );

        await logAudit({
            user_id: req.user.id,
            username: req.user.username,
            action: 'RESULTS_PUBLISHED',
            resource_type: 'POLL',
            resource_id: id,
            status: 'SUCCESS',
            ip_address: req.ip
        });

        res.json({ message: 'Results published successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error publishing results' });
    }
};

const getResults = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'SELECT vote_data, COUNT(*) as count FROM votes WHERE poll_id = $1 GROUP BY vote_data',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results' });
    }
};

module.exports = { createPoll, getPolls, castVote, publishResults, getResults };
