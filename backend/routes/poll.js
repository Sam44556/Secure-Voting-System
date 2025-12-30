const express = require('express');
const router = express.Router();
const { createPoll, getPolls, getPollById, castVote, getResults, publishResults } = require('../controllers/pollController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.post('/', authenticate, authorizeRoles('admin', 'election_officer'), createPoll);
router.get('/', authenticate, getPolls);
router.get('/:id', authenticate, getPollById);
router.post('/vote', authenticate, castVote);
router.get('/:id/results', authenticate, getResults);
router.put('/:id/publish', authenticate, authorizeRoles('admin', 'election_officer'), publishResults);

module.exports = router;
