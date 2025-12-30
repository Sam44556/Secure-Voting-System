const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../src/config/db');

// Get all alerts - Auditor & Admin only
router.get('/', authenticate, authorizeRoles('Auditor', 'Admin'), async (req, res) => {
  try {
    const { severity, acknowledged, limit = 100 } = req.query;

    let query = `
      SELECT 
        a.*,
        al.event_type as related_event,
        al.description as event_description,
        u.username as related_user
      FROM alerts a
      LEFT JOIN audit_logs al ON a.audit_log_id = al.id
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (severity) {
      query += ` AND a.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (acknowledged !== undefined) {
      query += ` AND a.notified = $${paramIndex}`;
      params.push(acknowledged === 'true');
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert statistics
router.get('/stats', authenticate, authorizeRoles('Auditor', 'Admin'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE severity = 'high') as high,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium,
        COUNT(*) FILTER (WHERE severity = 'low') as low,
        COUNT(*) FILTER (WHERE notified = false) as unacknowledged
      FROM alerts
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alert stats' });
  }
});

// Acknowledge alert
router.put('/:id/acknowledge', authenticate, authorizeRoles('Auditor', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE alerts SET notified = true WHERE id = $1',
      [id]
    );

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['alert_acknowledged', req.user.id, `Alert ${id} acknowledged`, true, req.ip]
    );

    res.json({ message: 'Alert acknowledged' });
  } catch (err) {
    console.error('Error acknowledging alert:', err);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Create alert (internal helper - also exported for use in other modules)
router.createAlert = async (alertType, severity, description, auditLogId = null) => {
  try {
    await pool.query(
      'INSERT INTO alerts (alert_type, severity, description, audit_log_id) VALUES ($1, $2, $3, $4)',
      [alertType, severity, description, auditLogId]
    );
    console.log(`🚨 Alert created: [${severity.toUpperCase()}] ${description}`);
  } catch (err) {
    console.error('Error creating alert:', err);
  }
};

module.exports = router;
