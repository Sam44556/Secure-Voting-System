const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const { sendOTPEmail } = require('../utils/emailService');

// Secrets from .env
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret';

// Password policy validation
const validatePassword = (password) => {
    return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password);
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// REGISTER
exports.register = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { username, full_name, email, password, date_of_birth, region, captchaToken } = req.body;

        // Validate password
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be 12+ chars with uppercase, lowercase, number, and symbol' });
        }

        // Validate age (ABAC: must be 18+)
        const age = new Date().getFullYear() - new Date(date_of_birth).getFullYear();
        if (age < 18) {
            return res.status(400).json({ error: 'Must be 18 or older to register' });
        }

        const hash = await bcrypt.hash(password, 10);

        // Insert user (all users start unverified)
        const result = await client.query(
            `INSERT INTO users (username, full_name, email, password_hash, date_of_birth, region, is_verified, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, false, true) RETURNING id, email, username`,
            [username, full_name, email, hash, date_of_birth, region]
        );

        const userId = result.rows[0].id;

        // Generate OTP for email verification (all users)
        const otp = generateOTP();
        await client.query(
            'INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, otp, 'verification', new Date(Date.now() + 10 * 60 * 1000)] // 10 min expiry
        );
        
        // Send OTP via email
        await sendOTPEmail(email, otp, 'verification');

        // Audit log
        await client.query(
            'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
            ['registration', userId, `User ${username} registered`, true, req.ip]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Registration successful! Check your email for OTP.',
            userId: userId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    } finally {
        client.release();
    }
};

// VERIFY OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { userId, otp, purpose } = req.body;

        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE user_id = $1 AND purpose = $2 AND otp_code = $3 AND expires_at > NOW() AND attempts < 3',
            [userId, purpose, otp]
        );

        if (result.rowCount === 0) {
            await pool.query(
                'UPDATE otp_verifications SET attempts = attempts + 1 WHERE user_id = $1 AND purpose = $2 AND otp_code = $3',
                [userId, purpose, otp]
            );
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Delete used OTP
        await pool.query('DELETE FROM otp_verifications WHERE id = $1', [result.rows[0].id]);

        if (purpose === 'verification') {
            await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [userId]);
            await pool.query(
                'INSERT INTO audit_logs (event_type, user_id, description, success) VALUES ($1, $2, $3, $4)',
                ['email_verification', userId, 'Email verified successfully', true]
            );
            res.json({ message: 'Email verified successfully! You can now log in.' });
        } else if (purpose === 'mfa') {
            res.json({ message: 'MFA verified', userId });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during OTP verification' });
    }
};

// LOGIN
exports.login = async (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        // Find user with roles
        const userRes = await pool.query(`
            SELECT u.*, COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') as roles 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            LEFT JOIN roles r ON ur.role_id = r.id 
            WHERE u.username = $1 OR LOWER(u.email) = LOWER($1)
            GROUP BY u.id
        `, [username]);

        console.log('Login query result for:', username, 'roles:', userRes.rows[0]?.roles);

        if (userRes.rowCount === 0) {
            // Log failed attempt
            await pool.query(
                'INSERT INTO login_attempts (success, ip_address, user_agent, failure_reason, attempt_time) VALUES ($1, $2, $3, $4, NOW())',
                [false, ip, userAgent, 'User not found']
            );
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const remainingTime = Math.ceil((new Date(user.locked_until) - new Date()) / 1000 / 60);
            return res.status(423).json({
                error: `Account locked. Try again in ${remainingTime} minutes.`,
                lockedUntil: user.locked_until
            });
        }

        // Verify password
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) {
            const newAttempts = (user.failed_login_attempts || 0) + 1;
            let lockUntil = null;

            if (newAttempts >= 5) {
                lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
            }

            await pool.query(
                'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
                [newAttempts, lockUntil, user.id]
            );

            // Log failed attempt
            const loginAttemptRes = await pool.query(
                'INSERT INTO login_attempts (user_id, success, ip_address, user_agent, failure_reason, attempt_time) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
                [user.id, false, ip, userAgent, 'Invalid password']
            );

            // Create audit log for failed login
            const auditRes = await pool.query(
                'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                ['login_failed', user.id, `Failed login attempt for ${username} (attempt ${newAttempts}/5)`, false, ip]
            );

            // 🚨 ALERT: Create security alert after 3+ failed attempts
            if (newAttempts >= 3) {
                const severity = newAttempts >= 5 ? 'high' : 'medium';
                await pool.query(
                    'INSERT INTO alerts (alert_type, severity, description, audit_log_id) VALUES ($1, $2, $3, $4)',
                    [
                        'brute_force_attempt',
                        severity,
                        `Multiple failed login attempts (${newAttempts}) for user ${username} from IP ${ip}`,
                        auditRes.rows[0].id
                    ]
                );
                console.log(`🚨 ALERT: Brute force attempt detected for ${username} (${newAttempts} failed attempts)`);
            }

            if (lockUntil) {
                // Create high severity alert for account lockout
                await pool.query(
                    'INSERT INTO alerts (alert_type, severity, description, audit_log_id) VALUES ($1, $2, $3, $4)',
                    [
                        'account_locked',
                        'high',
                        `Account locked for user ${username} after 5 failed login attempts from IP ${ip}`,
                        auditRes.rows[0].id
                    ]
                );
                return res.status(423).json({ error: 'Too many failed attempts. Account locked for 30 minutes.' });
            }

            return res.status(401).json({
                error: 'Invalid credentials',
                attemptsRemaining: 5 - newAttempts
            });
        }

        // Reset failed attempts
        await pool.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
            [user.id]
        );

        // Check if email is verified
        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email first' });
        }

        // Check if MFA is enabled
        if (user.mfa_enabled) {
            const otp = generateOTP();
            await pool.query(
                'INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
                [user.id, otp, 'mfa', new Date(Date.now() + 5 * 60 * 1000)] // 5 min
            );
            console.log(`\n🔐 MFA OTP for ${username}: ${otp}\n`);
            return res.json({
                message: 'MFA required',
                userId: user.id,
                requiresMFA: true
            });
        }

        // Generate tokens
        const userRole = user.roles && user.roles[0] ? user.roles[0] : null;
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: userRole, roles: user.roles },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');
        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
            [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ip, userAgent] // 7 days
        );

        // Log successful login
        await pool.query(
            'INSERT INTO login_attempts (user_id, success, ip_address, user_agent, attempt_time) VALUES ($1, $2, $3, $4, NOW())',
            [user.id, true, ip, userAgent]
        );

        await pool.query(
            'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
            ['login', user.id, `User ${username} logged in`, true, ip]
        );

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: userRole,
                roles: user.roles,
                isVerified: user.is_verified,
                mfaEnabled: user.mfa_enabled
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// VERIFY MFA (during login)
exports.verifyMFA = async (req, res) => {
    const { userId, otp } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        // Verify OTP
        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE user_id = $1 AND purpose = $2 AND otp_code = $3 AND expires_at > NOW() AND attempts < 3',
            [userId, 'mfa', otp]
        );

        if (result.rowCount === 0) {
            await pool.query(
                'UPDATE otp_verifications SET attempts = attempts + 1 WHERE user_id = $1 AND purpose = $2',
                [userId, 'mfa']
            );
            return res.status(400).json({ error: 'Invalid or expired MFA code' });
        }

        // Delete used OTP
        await pool.query('DELETE FROM otp_verifications WHERE id = $1', [result.rows[0].id]);

        // Get user with roles
        const userRes = await pool.query(`
            SELECT u.*, array_agg(r.name) as roles 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            LEFT JOIN roles r ON ur.role_id = r.id 
            WHERE u.id = $1 
            GROUP BY u.id
        `, [userId]);

        const user = userRes.rows[0];
        const userRole = user.roles && user.roles[0] ? user.roles[0] : null;

        // Generate tokens
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: userRole, roles: user.roles },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');
        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
            [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ip, userAgent]
        );

        // Log successful MFA verification
        await pool.query(
            'INSERT INTO login_attempts (user_id, success, ip_address, user_agent, attempt_time) VALUES ($1, $2, $3, $4, NOW())',
            [user.id, true, ip, userAgent]
        );

        await pool.query(
            'INSERT INTO audit_logs (event_type, user_id, description, success, ip_address) VALUES ($1, $2, $3, $4, $5)',
            ['mfa_login', user.id, `User ${user.username} logged in with MFA`, true, ip]
        );

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: userRole,
                roles: user.roles,
                isVerified: user.is_verified,
                mfaEnabled: user.mfa_enabled
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during MFA verification' });
    }
};

// ENABLE MFA
exports.enableMFA = async (req, res) => {
    const userId = req.user.id;

    try {
        const secret = speakeasy.generateSecret({ length: 32 });

        await pool.query(
            'UPDATE users SET mfa_secret = $1, mfa_enabled = true WHERE id = $2',
            [secret.base32, userId]
        );

        await pool.query(
            'INSERT INTO audit_logs (event_type, user_id, description, success) VALUES ($1, $2, $3, $4)',
            ['mfa_enabled', userId, 'User enabled MFA', true]
        );

        res.json({
            secret: secret.base32,
            qrCodeUrl: `otpauth://totp/SecureVote:${req.user.username}?secret=${secret.base32}&issuer=SecureVote`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error enabling MFA' });
    }
};

// DISABLE MFA
exports.disableMFA = async (req, res) => {
    const userId = req.user.id;

    try {
        await pool.query(
            'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
            [userId]
        );

        await pool.query(
            'INSERT INTO audit_logs (event_type, user_id, description, success) VALUES ($1, $2, $3, $4)',
            ['mfa_disabled', userId, 'User disabled MFA', true]
        );

        res.json({ message: 'MFA disabled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error disabling MFA' });
    }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW() AND revoked_at IS NULL',
            [refreshToken]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const tokenData = result.rows[0];

        // Get user with roles
        const userRes = await pool.query(`
            SELECT u.*, array_agg(r.name) as roles 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            LEFT JOIN roles r ON ur.role_id = r.id 
            WHERE u.id = $1 
            GROUP BY u.id
        `, [tokenData.user_id]);

        const user = userRes.rows[0];
        const userRole = user.roles && user.roles[0] ? user.roles[0] : null;

        const newAccessToken = jwt.sign(
            { id: user.id, username: user.username, role: userRole, roles: user.roles },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error refreshing token' });
    }
};
