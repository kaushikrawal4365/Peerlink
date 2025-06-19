const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    console.log(`[Auth Middleware] Checking route: ${req.method} ${req.originalUrl}`);
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            console.log('[Auth Middleware] No token provided.');
            return res.status(401).json({ error: 'No token provided' });
        }
        console.log('[Auth Middleware] Token received.');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] Token decoded:', decoded);

        req.user = await User.findById(decoded.userId).select('-password');

        if (!req.user) {
            console.error(`[Auth Middleware] User not found for ID: ${decoded.userId}`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`[Auth Middleware] User authenticated: ${req.user.email}`);
        next();
    } catch (error) {
        console.error('[Auth Middleware] Auth error:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
