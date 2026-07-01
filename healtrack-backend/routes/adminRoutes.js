const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/pending-clinics', adminController.getPendingClinics);
router.get('/outbreak-stats', adminController.getOutbreakStats);

module.exports = router;
