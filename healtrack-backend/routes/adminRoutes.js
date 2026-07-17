const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware(['SuperAdmin']));

router.get('/pending-clinics', adminController.getPendingClinics);
router.post('/verify-clinic', adminController.verifyClinic);
router.post('/create-clinic', adminController.createClinic);
router.get('/epidemiology', adminController.getEpidemiologyTrends);
router.get('/ai-health', adminController.getAiSystemHealth);
router.get('/ecosystem-kpis', adminController.getEcosystemKpis);
router.get('/auracare-stats', adminController.getAuraCareStats);
router.post('/broadcast-awareness', adminController.broadcastAwareness);
router.get('/outbreak-news', adminController.getOutbreakNews);
router.get('/patient-analytics', adminController.getPatientAnalytics);

router.get('/patients', adminController.getAllPatients);
router.post('/patients/:userId/status', adminController.updatePatientStatus);
router.delete('/patients/:patientId', adminController.deletePatient);
router.delete('/clinics/:clinicId', adminController.deleteClinic);

// Clinic Management Routes
router.get('/clinics/:clinicId/details', adminController.getClinicDetails);
router.put('/clinics/:clinicId', adminController.updateClinicDetails);
router.post('/clinics/:clinicId/departments', adminController.addClinicDepartment);
router.delete('/clinics/:clinicId/departments/:serviceId', adminController.removeClinicDepartment);
router.post('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// Standalone Pharmacy Account Management
router.get('/pharmacy-accounts', adminController.listPharmacyAccounts);
router.post('/pharmacy-accounts', adminController.createPharmacyAccount);
router.post('/pharmacy-accounts/:userId/status', adminController.updatePharmacyAccountStatus);
router.post('/pharmacy-accounts/:userId/reset-password', adminController.resetPharmacyPassword);
router.delete('/pharmacy-accounts/:userId', adminController.deletePharmacyAccount);

module.exports = router;
