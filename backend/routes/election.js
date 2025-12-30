const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../src/config/db');

// Create election - only Election Officer
router.post('/', authenticate, authorizeRoles('Election Officer'), async (req, res) => {
  const { title, description, election_type, region, start_time, end_time, options } = req.body;

  const startTime = new Date(start_time);
  const endTime = new Date(end_time);

  if (startTime >= endTime) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  try {
    const electionRes = await pool.query(
      `INSERT INTO elections (title, description, election_type, region, start_time, end_time, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING id`,
      [title, description, election_type, region, startTime.toISOString(), endTime.toISOString(), req.user.id]
    );
    const electionId = electionRes.rows[0].id;

    // Insert options
    for (let i = 0; i < options.length; i++) {
      await pool.query(
        'INSERT INTO election_options (election_id, option_text, position) VALUES ($1, $2, $3)',
        [electionId, options[i], i + 1]
      );
    }

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['election_create', req.user.id, `Created election "${title}"`, true, req.ip]
    );

    res.json({ message: 'Election created successfully', electionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get elections - Role based filtering
// Election Officers see only their own elections
// Voters see all active/past elections they can vote in
// Admin sees all
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('Admin');
    const isOfficer = userRoles.includes('Election Officer');
    const isVoter = userRoles.includes('Voter');

    let query;
    let params = [];

    if (isAdmin) {
      // Admin sees all elections
      query = `
        SELECT e.*, u.username AS created_by_name,
               (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) AS vote_count
        FROM elections e
        LEFT JOIN users u ON e.created_by = u.id
        ORDER BY e.start_time DESC
      `;
    } else if (isOfficer) {
      // Election Officer sees only their own created elections
      query = `
        SELECT e.*, u.username AS created_by_name,
               (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) AS vote_count
        FROM elections e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.created_by = $1
        ORDER BY e.start_time DESC
      `;
      params = [userId];
    } else {
      // Voters and others see all elections (for voting purposes)
      query = `
        SELECT e.*, u.username AS created_by_name,
               (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) AS vote_count
        FROM elections e
        LEFT JOIN users u ON e.created_by = u.id
        ORDER BY e.start_time DESC
      `;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// Search users for assistant (Election Officers only) - MUST be before /:id route!
router.get('/search-officers', authenticate, authorizeRoles('Election Officer', 'Admin'), async (req, res) => {
  const { q } = req.query;
  console.log('Search officers called with query:', q);

  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.email, u.full_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Election Officer'
        AND u.id != $1
        AND (u.username ILIKE $2 OR u.email ILIKE $2 OR u.full_name ILIKE $2)
      LIMIT 10
    `, [req.user.id, `%${q}%`]);

    console.log('Search results:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching officers:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get elections where user is assistant - MUST be before /:id route!
router.get('/my-assisted', authenticate, authorizeRoles('Election Officer'), async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        p.permission_type,
        u.username as owner_name
      FROM elections e
      JOIN permissions p ON p.resource_id = e.id AND p.resource_type = 'election'
      JOIN users u ON e.created_by = u.id
      WHERE p.user_id = $1 AND p.revoked_at IS NULL
      ORDER BY e.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assisted elections:', err);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// Get single election with options
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log('Fetching election with id:', id);
  try {
    const election = await pool.query('SELECT * FROM elections WHERE id = $1', [id]);
    console.log('Election found:', election.rowCount);
    const options = await pool.query('SELECT id, option_text FROM election_options WHERE election_id = $1 ORDER BY position', [id]);
    console.log('Options found:', options.rowCount, options.rows);
    if (election.rowCount === 0) return res.status(404).json({ error: 'Not found' });

    res.json({ ...election.rows[0], options: options.rows });
  } catch (err) {
    console.error('Error fetching election:', err);
    res.status(500).json({ error: 'Failed to fetch election' });
  }
});

// ========== DAC (Discretionary Access Control) - Assistants ==========

// Get assistants for an election
router.get('/:id/assistants', authenticate, authorizeRoles('Election Officer', 'Admin'), async (req, res) => {
  const electionId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if user is owner or admin
    const election = await pool.query('SELECT created_by FROM elections WHERE id = $1', [electionId]);
    if (election.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

    const isOwner = election.rows[0].created_by === userId;
    const isAdmin = req.user.roles?.includes('Admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only election owner or admin can view assistants' });
    }

    const assistants = await pool.query(`
      SELECT 
        p.id as permission_id,
        p.permission_type,
        p.granted_at,
        u.id as user_id,
        u.username,
        u.email,
        u.full_name,
        g.username as granted_by_name
      FROM permissions p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users g ON p.granted_by = g.id
      WHERE p.resource_type = 'election' 
        AND p.resource_id = $1 
        AND p.revoked_at IS NULL
      ORDER BY p.granted_at DESC
    `, [electionId]);

    res.json(assistants.rows);
  } catch (err) {
    console.error('Error fetching assistants:', err);
    res.status(500).json({ error: 'Failed to fetch assistants' });
  }
});

// Add assistant to election (DAC - Owner grants access)
router.post('/:id/assistants', authenticate, authorizeRoles('Election Officer', 'Admin'), async (req, res) => {
  const electionId = req.params.id;
  const { assistantId, permissionType = 'manage' } = req.body;
  const userId = req.user.id;

  try {
    // Check if user is owner
    const election = await pool.query('SELECT created_by, title FROM elections WHERE id = $1', [electionId]);
    if (election.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

    if (election.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Only election owner can add assistants (DAC)' });
    }

    // Check if assistant exists and is an Election Officer
    const assistant = await pool.query(`
      SELECT u.id, u.username 
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = 'Election Officer'
    `, [assistantId]);

    if (assistant.rowCount === 0) {
      return res.status(400).json({ error: 'User must be an Election Officer to be added as assistant' });
    }

    // Check if already an assistant
    const existing = await pool.query(`
      SELECT id FROM permissions 
      WHERE resource_type = 'election' AND resource_id = $1 AND user_id = $2 AND revoked_at IS NULL
    `, [electionId, assistantId]);

    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'User is already an assistant for this election' });
    }

    // Grant permission
    await pool.query(`
      INSERT INTO permissions (resource_type, resource_id, user_id, permission_type, granted_by)
      VALUES ('election', $1, $2, $3, $4)
    `, [electionId, assistantId, permissionType, userId]);

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        'dac_grant',
        userId,
        `Added assistant ${assistant.rows[0].username} to election "${election.rows[0].title}"`,
        true,
        req.ip,
        JSON.stringify({ electionId, assistantId, permissionType })
      ]
    );

    res.json({ message: `Assistant ${assistant.rows[0].username} added successfully` });
  } catch (err) {
    console.error('Error adding assistant:', err);
    res.status(500).json({ error: 'Failed to add assistant' });
  }
});

// Remove assistant from election (DAC - Owner revokes access)
router.delete('/:id/assistants/:assistantId', authenticate, authorizeRoles('Election Officer', 'Admin'), async (req, res) => {
  const { id: electionId, assistantId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is owner or admin
    const election = await pool.query('SELECT created_by, title FROM elections WHERE id = $1', [electionId]);
    if (election.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

    const isOwner = election.rows[0].created_by === userId;
    const isAdmin = req.user.roles?.includes('Admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only election owner or admin can remove assistants' });
    }

    // Revoke permission (soft delete)
    const result = await pool.query(`
      UPDATE permissions 
      SET revoked_at = NOW()
      WHERE resource_type = 'election' 
        AND resource_id = $1 
        AND user_id = $2 
        AND revoked_at IS NULL
      RETURNING id
    `, [electionId, assistantId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['dac_revoke', userId, `Removed assistant from election "${election.rows[0].title}"`, true, req.ip]
    );

    res.json({ message: 'Assistant removed successfully' });
  } catch (err) {
    console.error('Error removing assistant:', err);
    res.status(500).json({ error: 'Failed to remove assistant' });
  }
});

// Update election (owner or assistant with manage permission)
router.put('/:id', authenticate, authorizeRoles('Election Officer', 'Admin'), async (req, res) => {
  const electionId = req.params.id;
  const userId = req.user.id;
  const { title, description, start_time, end_time } = req.body;

  try {
    // Check if user is owner or has permission
    const election = await pool.query('SELECT created_by FROM elections WHERE id = $1', [electionId]);
    if (election.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

    const isOwner = election.rows[0].created_by === userId;
    const isAdmin = req.user.roles?.includes('Admin');

    // Check DAC permission
    const hasPermission = await pool.query(`
      SELECT id FROM permissions 
      WHERE resource_type = 'election' 
        AND resource_id = $1 
        AND user_id = $2 
        AND permission_type = 'manage'
        AND revoked_at IS NULL
    `, [electionId, userId]);

    if (!isOwner && !isAdmin && hasPermission.rowCount === 0) {
      return res.status(403).json({ error: 'You do not have permission to edit this election' });
    }

    await pool.query(`
      UPDATE elections 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          updated_at = NOW()
      WHERE id = $5
    `, [title, description, start_time, end_time, electionId]);

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['election_update', userId, `Updated election ${electionId}`, true, req.ip]
    );

    res.json({ message: 'Election updated successfully' });
  } catch (err) {
    console.error('Error updating election:', err);
    res.status(500).json({ error: 'Failed to update election' });
  }
});

// Publish results (owner or admin only) - MAC: Changes sensitivity from 'internal' → 'public'
router.post('/:id/publish', authenticate, authorizeRoles('Election Officer', 'Admin'), async (req, res) => {
  const electionId = req.params.id;
  const userId = req.user.id;

  try {
    const election = await pool.query('SELECT * FROM elections WHERE id = $1', [electionId]);
    if (election.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

    const el = election.rows[0];
    const isOwner = el.created_by === userId;
    const isAdmin = req.user.roles?.includes('Admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only owner or admin can publish results' });
    }

    // Check if election has ended (RuBAC)
    if (new Date() < new Date(el.end_time)) {
      return res.status(400).json({ error: 'Cannot publish results before election ends (RuBAC enforced)' });
    }

    const previousLevel = el.sensitivity_level || 'internal';

    // MAC: Update election - change sensitivity_level from 'internal' to 'public'
    await pool.query(`
      UPDATE elections 
      SET results_published = true, 
          sensitivity_level = 'public',
          updated_at = NOW() 
      WHERE id = $1
    `, [electionId]);

    // Update security_labels table for MAC tracking
    await pool.query(`
      INSERT INTO security_labels (resource_type, resource_id, label, assigned_by)
      VALUES ('election_results', $1, 'public', $2)
      ON CONFLICT (resource_type, resource_id) 
      DO UPDATE SET label = 'public', assigned_by = $2, assigned_at = NOW()
    `, [electionId, userId]);

    // Audit log with MAC change details
    await pool.query(
      `INSERT INTO audit_logs (event_type, user_id, description, success, ip_address, details) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'mac_label_change', 
        userId, 
        `MAC: Published results for "${el.title}" - Changed sensitivity from ${previousLevel.toUpperCase()} to PUBLIC`, 
        true, 
        req.ip,
        JSON.stringify({ 
          election_id: electionId, 
          previous_level: previousLevel, 
          new_level: 'public',
          action: 'results_published'
        })
      ]
    );

    res.json({ 
      message: 'Results published successfully!',
      mac_change: {
        previous: previousLevel,
        current: 'public',
        action: 'Results are now visible to all users'
      }
    });
  } catch (err) {
    console.error('Error publishing results:', err);
    res.status(500).json({ error: 'Failed to publish results' });
  }
});

module.exports = router;