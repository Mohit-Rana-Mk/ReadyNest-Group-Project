const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');

// Mount auth middleware to protect all doctor routes
// router.use(authMiddleware); // DISABLED FOR TESTING

// A. Daily Patient Queue
router.get('/appointments', doctorController.getAppointments);

// B. Longitudinal Patient History
router.get('/patient-history/:id', doctorController.getPatientHistory);

// C. Atomic Consultation Sign-Off (Transactional)
router.post('/complete-consultation', doctorController.completeConsultation);

module.exports = router;
