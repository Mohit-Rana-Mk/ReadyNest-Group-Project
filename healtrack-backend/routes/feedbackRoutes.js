const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const jwt = require('jsonwebtoken');

// Optional auth middleware for feedback submission
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
        // Continue if token invalid
    }
    next();
};

router.post('/', optionalAuth, feedbackController.submitFeedback);
router.get('/', feedbackController.getFeedbackList);

module.exports = router;
