const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../src/config/db');

// Get all audit logs - Auditor & Admin only
router.get('/logs', authenticate, authorizeRoles('Auditor', 'Admin'), async (req, res) => {
  try {
    const { search, eventType, startDate, endDate, limit = 200 } = req.query;

    let query = `
      SELECT 
        a.id,
        a.event_type,
        a.user_id,
        a.description,
        a.ip_address,
        a.timestamp,
        a.success,
        a.details,
        u.username,
        u.email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      query += ` AND (a.description ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex} OR a.event_type ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Event type filter
    if (eventType) {
      query += ` AND a.event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    // Date range filters
    if (startDate) {
      query += ` AND a.timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND a.timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY a.timestamp DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    // Format for frontend
    const logs = result.rows.map(log => ({
      id: log.id,
      event_type: log.event_type,
      action: log.event_type?.toUpperCase().replace(/_/g, '_'),
      user_id: log.user_id,
      username: log.username || 'System',
      description: log.description,
      ip_address: log.ip_address || 'N/A',
      timestamp: log.timestamp,
      status: log.success ? 'SUCCESS' : 'FAILURE',
      details: log.details
    }));

    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log statistics
router.get('/stats', authenticate, authorizeRoles('Auditor', 'Admin'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE success = false) as failed_events,
        COUNT(*) FILTER (WHERE event_type = 'vote_cast') as votes_cast,
        COUNT(*) FILTER (WHERE event_type = 'registration') as new_registrations,
        COUNT(*) FILTER (WHERE event_type = 'login') as logins,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Error fetching audit stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all elections with results - Auditor & Admin only
router.get('/elections', authenticate, authorizeRoles('Auditor', 'Admin'), async (req, res) => {
  try {
    const elections = await pool.query(`
      SELECT 
        e.*,
        u.username as created_by_name,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) as vote_count,
        CASE 
          WHEN e.end_time < NOW() THEN 'closed'
          WHEN e.start_time > NOW() THEN 'upcoming'
          ELSE 'active'
        END as computed_status
      FROM elections e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.created_at DESC
    `);

    // Get results for each election
    const electionsWithResults = await Promise.all(
      elections.rows.map(async (election) => {
        const results = await pool.query(`
          SELECT 
            eo.id,
            eo.option_text,
            COUNT(v.id) as vote_count
          FROM election_options eo
          LEFT JOIN votes v ON eo.id = v.option_id
          WHERE eo.election_id = $1
          GROUP BY eo.id, eo.option_text
          ORDER BY vote_count DESC
        `, [election.id]);

        return {
          ...election,
          results: results.rows
        };
      })
    );

    res.json(electionsWithResults);
  } catch (err) {
    console.error('Error fetching elections:', err);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// Get event types for filtering
router.get('/event-types', authenticate, authorizeRoles('Auditor', 'Admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT event_type 
      FROM audit_logs 
      ORDER BY event_type
    `);
    res.json(result.rows.map(r => r.event_type));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

module.exports = router;
