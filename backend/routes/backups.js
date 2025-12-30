const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../src/config/db');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Get all backups - Admin only
router.get('/', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        u.username as created_by_name
      FROM backups b
      LEFT JOIN users u ON b.created_by = u.id
      ORDER BY b.backup_time DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching backups:', err);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// Get backup statistics
router.get('/stats', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failure') as failed,
        MAX(backup_time) as last_backup,
        MIN(backup_time) FILTER (WHERE status = 'success') as first_backup
      FROM backups
    `);

    // Get database size (approximation)
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
    `);

    res.json({
      ...stats.rows[0],
      database_size: sizeResult.rows[0].db_size
    });
  } catch (err) {
    console.error('Error fetching backup stats:', err);
    res.status(500).json({ error: 'Failed to fetch backup statistics' });
  }
});

// Trigger manual backup - Admin only
router.post('/trigger', authenticate, authorizeRoles('Admin'), async (req, res) => {
  const userId = req.user.id;

  try {
    // In production, this would run pg_dump
    // For demo, we simulate a backup record
    const backupTime = new Date();
    const backupPath = `backups/voting_system_${backupTime.toISOString().replace(/[:.]/g, '-')}.sql`;
    const checksum = crypto.randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO backups (backup_time, backup_path, status, checksum, details, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        backupTime,
        backupPath,
        'success',
        checksum,
        'Manual backup triggered via admin dashboard',
        userId
      ]
    );

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['backup_triggered', userId, `Manual backup created: ${backupPath}`, true, req.ip]
    );

    res.json({
      message: 'Backup triggered successfully',
      backup: {
        path: backupPath,
        time: backupTime,
        checksum
      }
    });
  } catch (err) {
    console.error('Error triggering backup:', err);

    // Log failed backup
    await pool.query(
      `INSERT INTO backups (backup_time, backup_path, status, details, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [new Date(), 'failed', 'failure', err.message, userId]
    );

    res.status(500).json({ error: 'Failed to trigger backup' });
  }
});

// Seed initial backup records (for demo purposes)
router.post('/seed', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    // Check if backups exist
    const existing = await pool.query('SELECT COUNT(*) FROM backups');
    if (parseInt(existing.rows[0].count) > 0) {
      return res.json({ message: 'Backups already seeded' });
    }

    // Create demo backup records
    const demoBackups = [
      { daysAgo: 0, hour: 3, status: 'success' },
      { daysAgo: 1, hour: 3, status: 'success' },
      { daysAgo: 2, hour: 3, status: 'success' },
      { daysAgo: 3, hour: 3, status: 'failure' },
      { daysAgo: 4, hour: 3, status: 'success' },
      { daysAgo: 5, hour: 3, status: 'success' },
      { daysAgo: 6, hour: 3, status: 'success' },
    ];

    for (const backup of demoBackups) {
      const backupTime = new Date();
      backupTime.setDate(backupTime.getDate() - backup.daysAgo);
      backupTime.setHours(backup.hour, 0, 0, 0);

      await pool.query(
        `INSERT INTO backups (backup_time, backup_path, status, checksum, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          backupTime,
          `backups/voting_system_${backupTime.toISOString().replace(/[:.]/g, '-')}.sql`,
          backup.status,
          backup.status === 'success' ? crypto.randomBytes(16).toString('hex') : null,
          backup.status === 'success' ? 'Automated daily backup' : 'Database connection timeout'
        ]
      );
    }

    res.json({ message: 'Demo backup records created' });
  } catch (err) {
    console.error('Error seeding backups:', err);
    res.status(500).json({ error: 'Failed to seed backups' });
  }
});

module.exports = router;
