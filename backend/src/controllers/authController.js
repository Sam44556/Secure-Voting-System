const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { logAudit } = require('../middleware/audit');
require('dotenv').config();

const register = async (req, res) => {
    const { username, email, password, age, region, department, location } = req.body;

    try {
        // 1. Password Complexity Check (Workflow 1: min 12 chars)
        if (!password || password.length < 12) {
            return res.status(400).json({ message: 'Password must be at least 12 characters long' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Generate Verification Token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 3. Insert user with role=NULL (Workflow 1)
        const result = await db.query(
            `INSERT INTO users 
            (username, email, password_hash, age, region, department, location, role, verification_token, token_expiry) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9) 
            RETURNING id, username, email`,
            [username, email, hashedPassword, age, region, department, location, verificationToken, tokenExpiry]
        );

        const newUser = result.rows[0];

        // 4. Log Action (Workflow 7)
        await logAudit({
            user_id: newUser.id,
            username: newUser.username,
            action: 'USER_REGISTERED',
            resource_type: 'USER',
            resource_id: newUser.id,
            status: 'SUCCESS',
            details: { email: newUser.email },
            ip_address: req.ip
        });

        // Mock sending email
        console.log(`[MOCK EMAIL] Verification token for ${email}: ${verificationToken}`);

        res.status(201).json({
            message: 'User registered successfully. Please verify your email via the token sent.',
            verificationToken: verificationToken // Returning it for dev/testing convenience
        });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const result = await db.query(
            'SELECT id, username FROM users WHERE verification_token = $1 AND token_expiry > NOW()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        const user = result.rows[0];

        await db.query(
            'UPDATE users SET is_email_verified = TRUE, verification_token = NULL, token_expiry = NULL WHERE id = $1',
            [user.id]
        );

        await logAudit({
            user_id: user.id,
            username: user.username,
            action: 'EMAIL_VERIFIED',
            resource_type: 'USER',
            resource_id: user.id,
            status: 'SUCCESS',
            ip_address: req.ip
        });

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during verification' });
    }
};

const login = async (req, res) => {
    const { username, password, otp } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 1. Check if verified (Workflow 1)
        if (!user.is_email_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        // 2. Check Lockout (Workflow 2: 30 mins)
        if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
            const timeLeft = Math.ceil((new Date(user.lockout_until) - new Date()) / 1000 / 60);
            return res.status(403).json({ message: `Account locked. Try again in ${timeLeft} minutes.` });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            // Update failed attempts and handle lockout (Workflow 2)
            const fd = user.failed_login_attempts + 1;
            let lockout = null;
            if (fd >= 5) {
                lockout = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
            }
            await db.query('UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3', [fd, lockout, user.id]);

            await logAudit({
                user_id: user.id,
                username: user.username,
                action: 'LOGIN_FAILURE',
                resource_type: 'USER',
                resource_id: user.id,
                status: 'FAILURE',
                details: { reason: 'Invalid password', attempts: fd },
                ip_address: req.ip
            });

            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Reset failed attempts on success
        await db.query('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1', [user.id]);

        // 3. MFA Check (Workflow 2)
        if (user.is_mfa_enabled) {
            if (!otp) {
                return res.status(200).json({ mfaRequired: true, userId: user.id });
            }
            // Mock OTP validation
            if (otp !== '123456') {
                return res.status(401).json({ message: 'Invalid OTP' });
            }
        }

        // 4. Role-based Redirection logic will be handled on frontend, but we need to return role
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Workflow 2: 15 mins
        );

        // Workflow 2: Refresh token (Mocked for now as same token or simpler)
        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await logAudit({
            user_id: user.id,
            username: user.username,
            action: 'LOGIN_SUCCESS',
            resource_type: 'USER',
            resource_id: user.id,
            status: 'SUCCESS',
            ip_address: req.ip
        });

        res.json({
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                clearance_level: user.clearance_level,
                is_mfa_enabled: user.is_mfa_enabled
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = { register, verifyEmail, login };
