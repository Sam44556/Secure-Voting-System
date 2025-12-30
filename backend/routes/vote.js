const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../src/config/db');

// Cast vote - only voter role
router.post('/:electionId', authenticate, authorizeRoles('Voter'), async (req, res) => {
  const electionId = req.params.electionId;
  const { optionId } = req.body;
  const userId = req.user.id;
  const ip = req.ip;

  try {
    // Get election and user details
    const electionRes = await pool.query('SELECT * FROM elections WHERE id = $1', [electionId]);
    if (electionRes.rowCount === 0) return res.status(404).json({ error: 'Election not found' });
    const election = electionRes.rows[0];

    const userRes = await pool.query('SELECT date_of_birth, region, is_verified FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    // RuBAC: Time window check
    const now = new Date();
    if (now < new Date(election.start_time) || now > new Date(election.end_time)) {
      return res.status(403).json({ error: 'Voting window closed (RuBAC)' });
    }

    // ABAC checks
    const birthDate = new Date(user.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) return res.status(403).json({ error: 'You must be 18 or older to vote' });
    if (!user.is_verified) return res.status(403).json({ error: 'Your account must be verified to vote' });
    if (election.region && election.region.trim() !== '' && user.region !== election.region) {
      return res.status(403).json({ error: `This election is restricted to ${election.region} region` });
    }

    // One-vote check
    const existingVote = await pool.query(
      'SELECT id FROM votes WHERE election_id = $1 AND user_id = $2',
      [electionId, userId]
    );
    if (existingVote.rowCount > 0) return res.status(403).json({ error: 'You have already voted in this election' });

    // Verify the option belongs to this election
    const optionCheck = await pool.query(
      'SELECT id FROM election_options WHERE id = $1 AND election_id = $2',
      [optionId, electionId]
    );
    if (optionCheck.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid voting option' });
    }

    // Record vote with MAC classification (confidential)
    const voteRes = await pool.query(
      `INSERT INTO votes (election_id, user_id, option_id, ip_address, classification)
       VALUES ($1, $2, $3, $4, 'confidential')
       RETURNING id, classification`,
      [electionId, userId, optionId, ip]
    );

    // Also insert into security_labels table for MAC tracking
    await pool.query(
      `INSERT INTO security_labels (resource_type, resource_id, label, assigned_by)
       VALUES ('vote', $1, 'confidential', $2)
       ON CONFLICT (resource_type, resource_id) DO NOTHING`,
      [voteRes.rows[0].id, userId]
    );

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['vote_cast', userId, `Voted in election: ${election.title}`, true, ip]
    );

    res.json({ message: 'Your vote has been securely recorded!' });
  } catch (err) {
    console.error('Vote error:', err);
    // Log failed vote attempt
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['vote_failed', req.user.id, `Failed vote attempt: ${err.message}`, false, req.ip]
    ).catch(() => {});
    res.status(500).json({ error: 'Failed to record vote. Please try again.' });
  }
});

// Get results - MAC enforced based on results_published and sensitivity_level
router.get('/:electionId/results', authenticate, async (req, res) => {
  const electionId = req.params.electionId;

  try {
    const election = await pool.query('SELECT * FROM elections WHERE id = $1', [electionId]);
    if (election.rowCount === 0) return res.status(404).json({ error: 'Election not found' });

    const electionData = election.rows[0];
    const now = new Date();
    const isPast = now > new Date(electionData.end_time);
    const userRoles = req.user.roles || [req.user.role];
    const isAdminOrOfficer = userRoles.some(r => 
      ['admin', 'election officer'].includes((r || '').toLowerCase())
    );

    // MAC Check: Get current sensitivity level of election results
    const sensitivityLevel = electionData.sensitivity_level || 'internal';
    const resultsPublished = electionData.results_published;

    // MAC Enforcement:
    // - 'confidential' results: Only Admin can see (during voting)
    // - 'internal' results: Admin + Officer can see (after voting ends, before publish)
    // - 'public' results: Everyone can see (after publish)
    
    if (!resultsPublished) {
      // Results not published yet - MAC denies regular voters
      if (!isAdminOrOfficer) {
        // Log MAC denial
        await pool.query(
          'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
          ['mac_denied', req.user.id, `MAC denied: User tried to view ${sensitivityLevel} results for "${electionData.title}"`, false, req.ip]
        );
        return res.status(403).json({ 
          error: 'MAC Access Denied: Results are classified as ' + sensitivityLevel.toUpperCase() + '. Only authorized personnel can view.',
          classification: sensitivityLevel,
          reason: 'Results have not been published yet'
        });
      }
    }

    // If we reach here, access is granted
    // Log successful MAC check
    await pool.query(
      'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['mac_granted', req.user.id, `MAC granted: User viewed ${sensitivityLevel} results for "${electionData.title}"`, true, req.ip]
    );

    const results = await pool.query(`
      SELECT eo.option_text, COUNT(v.id)::int as vote_count
      FROM election_options eo
      LEFT JOIN votes v ON eo.id = v.option_id
      WHERE eo.election_id = $1
      GROUP BY eo.id, eo.option_text, eo.position
      ORDER BY vote_count DESC, eo.position ASC
    `, [electionId]);

    const totalVotes = results.rows.reduce((sum, r) => sum + r.vote_count, 0);

    res.json({
      results: results.rows,
      totalVotes,
      winner: results.rows[0]?.vote_count > 0 ? results.rows[0].option_text : 'No votes yet',
      electionTitle: electionData.title,
      isPast
    });
  } catch (err) {
    console.error('Results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Check if user has voted in an election
router.get('/:electionId/check', authenticate, async (req, res) => {
  try {
    const vote = await pool.query(
      'SELECT id FROM votes WHERE election_id = $1 AND user_id = $2',
      [req.params.electionId, req.user.id]
    );
    res.json({ hasVoted: vote.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check vote status' });
  }
});

module.exports = router;