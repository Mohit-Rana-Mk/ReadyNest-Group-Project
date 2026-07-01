const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Import modular controllers
const analyticsController = require('../controllers/clinic-admin/analyticsController');
const staffController = require('../controllers/clinic-admin/staffController');
const departmentController = require('../controllers/clinic-admin/departmentController');
const operationsController = require('../controllers/clinic-admin/operationsController');
const settingsController = require('../controllers/clinic-admin/settingsController');
const reportsController = require('../controllers/clinic-admin/reportsController');

// Mount auth middleware to protect all clinic admin routes
// router.use(authMiddleware); // DISABLED FOR TESTING

// A. Analytics & Financials
router.get('/:clinicId/analytics', analyticsController.getAnalytics);

// B. Staff Management
router.get('/:clinicId/staff', staffController.getStaff);
router.post('/:clinicId/staff', staffController.addStaff);
router.put('/:clinicId/staff/:staffId', staffController.updateStaff);

// C. Department Management
router.get('/services/global', departmentController.getAllGlobalServices); // Note: Order matters or it catches as clinicId if placed below
router.get('/:clinicId/departments', departmentController.getDepartments);
router.post('/:clinicId/departments', departmentController.addDepartment);
router.put('/:clinicId/departments/:serviceId', departmentController.updateDepartment);
router.delete('/:clinicId/departments/:serviceId', departmentController.deleteDepartment);

// D. Operations
router.get('/:clinicId/operations', operationsController.getOperations);

// E. Clinic Settings
router.get('/:clinicId/settings', settingsController.getClinicSettings);
router.put('/:clinicId/settings', settingsController.updateClinicSettings);

// F. Reports & Logs
router.get('/:clinicId/logs', reportsController.getLogs);
router.get('/:clinicId/reports/financial', reportsController.getFinancialReport);

module.exports = router;
