require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./src/config/db'); // Use existing DB config
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const pollRoutes = require('./routes/poll');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/elections', require('./routes/election'));
app.use('/api/vote', require('./routes/vote'));

// Phase 6: Auditor, Alerts, Backups routes
app.use('/api/audit', require('./routes/auditor'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/backups', require('./routes/backups'));

// Test route
app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            message: 'Backend is working!',
            databaseTime: result.rows[0].now,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database test failed' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
