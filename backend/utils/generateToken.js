const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, roles: user.roles },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET + 'refresh',
        { expiresIn: '7d' }
    );
};

module.exports = { generateAccessToken, generateRefreshToken };
