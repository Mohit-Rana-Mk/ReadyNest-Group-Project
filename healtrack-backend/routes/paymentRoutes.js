const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. PUBLIC WEBHOOK (No Auth)
router.post('/webhook', paymentController.handleWebhook);

// 2. SHARED DETAILS API (Requires Patient, SuperAdmin, or ClinicAdmin)
router.get('/details/:paymentId', authMiddleware(['Patient', 'SuperAdmin', 'ClinicAdmin']), paymentController.getPaymentDetails);

// 3. PATIENT PAYMENT ENDPOINTS
router.post('/create-order', authMiddleware(['Patient']), paymentController.createOrder);
router.post('/verify', authMiddleware(['Patient']), paymentController.verifyPayment);
router.get('/history', authMiddleware(['Patient']), paymentController.getPatientPayments);
router.post('/refund-request', authMiddleware(['Patient']), paymentController.requestRefund);

// 4. CLINIC ADMIN ENDPOINTS
router.get('/clinic/financials', authMiddleware(['ClinicAdmin']), paymentController.getClinicFinancials);
router.get('/clinic/bank-details', authMiddleware(['ClinicAdmin']), paymentController.getClinicBankDetails);
router.post('/clinic/bank-details', authMiddleware(['ClinicAdmin']), paymentController.updateClinicBankDetails);

// 5. SUPER ADMIN ENDPOINTS
router.get('/admin/overview', authMiddleware(['SuperAdmin']), paymentController.getAdminOverview);
router.get('/admin/payments', authMiddleware(['SuperAdmin']), paymentController.getAllPayments);
router.get('/admin/clinics-settlement-summary', authMiddleware(['SuperAdmin']), paymentController.getClinicsSettlementSummary);
router.post('/admin/settlements', authMiddleware(['SuperAdmin']), paymentController.recordSettlement);
router.get('/admin/bank-details/pending', authMiddleware(['SuperAdmin']), paymentController.getPendingBankAccounts);
router.put('/admin/bank-details/:id/approve', authMiddleware(['SuperAdmin']), paymentController.approveBankDetails);
router.get('/admin/refunds', authMiddleware(['SuperAdmin']), paymentController.getRefundRequests);
router.post('/admin/refunds/:id/process', authMiddleware(['SuperAdmin']), paymentController.processRefund);

module.exports = router;
