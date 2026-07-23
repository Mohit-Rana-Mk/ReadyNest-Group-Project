const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public/Authenticated route to raise support ticket from any portal
router.post('/tickets', authenticateToken, supportController.createTicket);

// Admin-only routes to view & manage tickets
router.get('/tickets', authenticateToken, requireAdmin, supportController.getAllTickets);
router.patch('/tickets/:id/status', authenticateToken, requireAdmin, supportController.updateTicketStatus);

module.exports = router;
