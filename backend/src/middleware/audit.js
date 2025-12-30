const db = require('../config/db');
const crypto = require('crypto');

// Helper to encrypt details (optional but requested)
const encrypt = (text) => {
    if (!process.env.LOG_ENCRYPTION_KEY) return text;
    try {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.LOG_ENCRYPTION_KEY), Buffer.alloc(16, 0));
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    } catch (e) {
        return text;
    }
};

const auditLogger = async (req, res, next) => {
    // We'll wrap the res.end or res.send to log AFTER the response is sent
    const originalSend = res.send;

    res.send = function (body) {
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : 'Anonymous';
        const action = `${req.method} ${req.originalUrl}`;
        const ip = req.ip || req.connection.remoteAddress;
        const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';

        const details = {
            params: req.params,
            query: req.query,
            body: req.method !== 'GET' ? req.body : {},
            responseStatus: res.statusCode
        };

        // Async logging to avoid blocking response
        db.query(
            'INSERT INTO audit_logs (user_id, username, action, status, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, username, action, status, JSON.stringify(details), ip]
        ).catch(err => console.error('Audit Log Error:', err));

        return originalSend.apply(res, arguments[0]);
    };

    next();
};

const logSystemEvent = async (eventType, description) => {
    try {
        await db.query(
            'INSERT INTO system_events (event_type, description) VALUES ($1, $2)',
            [eventType, description]
        );
    } catch (err) {
        console.error('System Event Log Error:', err);
    }
};

module.exports = { auditLogger, logSystemEvent };
