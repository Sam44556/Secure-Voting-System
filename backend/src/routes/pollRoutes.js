const express = require('express');
const router = express.Router();
const { createPoll, getPolls, castVote, publishResults, getResults } = require('../controllers/pollController');
const { authenticate, authorizeRoles, authorizeClearance } = require('../middleware/auth');
const { checkRuBAC, checkABAC, authorizeDAC } = require('../middleware/policyEngine');

// List polls (Filtered in controller by ABAC/MAC)
router.get('/', authenticate, getPolls);

// Create Poll (Workflow 4: Officer/Admin)
router.post('/',
    authenticate,
    authorizeRoles('Election Officer', 'Admin'),
    createPoll
);

// Cast Vote (Workflow 5: Layered security)
router.post('/vote',
    authenticate,
    authorizeRoles('Voter', 'Admin'), // RBAC
    checkRuBAC,                      // RuBAC (Election window)
    checkABAC,                      // ABAC (Age, Region, Verified)
    authorizeClearance('Public'),   // MAC (Vote data is public typically, but sensitivity can be higher)
    castVote
);

// Publish Results (Workflow 6: Officer/Admin)
router.put('/:id/publish',
    authenticate,
    authorizeRoles('Election Officer', 'Admin'),
    authorizeDAC('POLL', 'MANAGE'), // DAC (Only the owner/assigned officer)
    publishResults
);

// Get Results (Post-publish)
router.get('/:id/results',
    authenticate,
    getResults
);

module.exports = router;
