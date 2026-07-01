const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/recommendations', patientController.getRecommendations);
router.post('/triage', patientController.submitTriage);

module.exports = router;
