const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/receptionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protect all routes
router.get('/queue', receptionController.getQueue);
router.post('/walk-in', receptionController.registerWalkIn);

module.exports = router;
