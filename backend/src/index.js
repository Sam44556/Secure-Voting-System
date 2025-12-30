require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { logSystemEvent } = require('./middleware/audit');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Secure Voting System API',
        university: 'Addis Ababa Science and Technology University',
        department: 'Software Engineering',
        course: 'Computer System Security'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await logSystemEvent('STARTUP', 'System server started successfully');
});
