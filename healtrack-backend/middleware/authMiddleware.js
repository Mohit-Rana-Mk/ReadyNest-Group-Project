const jwt = require('jsonwebtoken');

const authMiddleware = (allowedRoles = []) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return res.status(500).json({ message: 'JWT Secret is not configured on the server' });
            }
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            
            if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
};

module.exports = authMiddleware;
