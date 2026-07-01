const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/receptionController');
const authMiddleware = require('../middleware/authMiddleware');

// router.use(authMiddleware); // Protect all routes (disabled for testing)

router.get('/:clinicId/lookup', receptionController.lookupPatient);

router.get('/:clinicId/queue', receptionController.getQueue);
router.put('/:clinicId/appointments/:appointmentId/check-in', receptionController.checkIn);
router.put('/:clinicId/appointments/:appointmentId/status', receptionController.updateStatus);
router.post('/:clinicId/walk-in', receptionController.registerWalkIn);

module.exports = router;
