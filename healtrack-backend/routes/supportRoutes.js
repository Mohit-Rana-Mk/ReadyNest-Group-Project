const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Optional auth middleware (extracts user info if token is provided, but allows request through if not)
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    try {
        const secret = process.env.JWT_SECRET;
        if (secret) {
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
        }
    } catch (e) {
        // Continue even if token invalid/expired
    }
    next();
};

// Route to raise support ticket from any portal
router.post('/tickets', optionalAuth, supportController.createTicket);

// Admin-only routes to view & manage tickets
router.get('/tickets', authMiddleware(['Admin', 'SuperAdmin']), supportController.getAllTickets);
router.patch('/tickets/:id/status', authMiddleware(['Admin', 'SuperAdmin']), supportController.updateTicketStatus);

module.exports = router;
