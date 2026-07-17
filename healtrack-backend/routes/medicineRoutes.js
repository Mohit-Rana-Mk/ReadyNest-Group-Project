const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. Prescription Queue
router.get('/prescriptions', authMiddleware(['Medicine']), medicineController.getPrescriptionQueue);
router.get('/prescriptions/:id', authMiddleware(['Medicine']), medicineController.getPrescriptionDetails);

// 2. Inventory / Stock Management
router.get('/stock', authMiddleware(['Medicine', 'ClinicAdmin']), medicineController.getInventory);
router.post('/stock', authMiddleware(['Medicine', 'ClinicAdmin']), medicineController.addMedicine);
router.put('/stock/:id', authMiddleware(['Medicine', 'ClinicAdmin']), medicineController.updateMedicine);
router.delete('/stock/:id', authMiddleware(['Medicine', 'ClinicAdmin']), medicineController.deleteMedicine);

// 3. Billing & Dispensing
router.post('/dispense', authMiddleware(['Medicine']), medicineController.dispenseMedicines);
router.post('/verify', authMiddleware(['Medicine']), medicineController.verifyOnlinePayment);
router.post('/cancel-bill', authMiddleware(['Medicine']), medicineController.cancelBill);

// 4. Bills History
router.get('/bills', authMiddleware(['Medicine', 'ClinicAdmin']), medicineController.getBills);
router.get('/bills/:id', authMiddleware(['Medicine', 'ClinicAdmin']), medicineController.getBillDetails);

// 5. Reports & Audit logs
router.get('/reports', authMiddleware(['Medicine', 'ClinicAdmin']), medicineController.getReports);
router.get('/audit-logs', authMiddleware(['Medicine', 'SuperAdmin', 'ClinicAdmin']), medicineController.getAuditLogs);

// 6. Helpers
router.get('/patients', authMiddleware(['Medicine']), medicineController.searchPatients);
router.get('/doctors', authMiddleware(['Medicine']), medicineController.getDoctors);

module.exports = router;
