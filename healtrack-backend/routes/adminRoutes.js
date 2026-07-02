const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/pending-clinics', adminController.getPendingClinics);
router.post('/verify-clinic', adminController.verifyClinic);
router.post('/create-clinic', adminController.createClinic);
router.get('/epidemiology', adminController.getEpidemiologyTrends);
router.get('/ai-health', adminController.getAiSystemHealth);
router.get('/ecosystem-kpis', adminController.getEcosystemKpis);

module.exports = router;
