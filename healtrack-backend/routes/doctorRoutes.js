const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/patient-history/:id', doctorController.getPatientHistory);
router.post('/complete-consultation', doctorController.completeConsultation);

module.exports = router;
