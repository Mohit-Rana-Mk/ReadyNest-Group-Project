// Boilerplate: JWT verification stub with development bypass
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        console.log("[AuthMiddleware] No token provided. Bypassing for development / testing.");
        req.user = { id: 1, role: 'admin', email: 'admin@healtrack.com' };
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (error) {
        console.log("[AuthMiddleware] Token verification failed. Bypassing for development / testing.");
        req.user = { id: 1, role: 'admin', email: 'admin@healtrack.com' };
        return next();
    }
};

module.exports = authMiddleware;
