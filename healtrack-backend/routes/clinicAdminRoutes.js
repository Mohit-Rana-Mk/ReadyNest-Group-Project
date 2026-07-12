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
router.use(authMiddleware(['ClinicAdmin']));

// A. Global Routes (No clinic ownership checks needed)
router.get('/services/global', departmentController.getAllGlobalServices);

// B. Clinic Param Verification Middleware (Enforce clinic isolation / prevent IDOR)
const verifyClinicAccess = require('../middleware/clinicAdminMiddleware');
router.use(verifyClinicAccess);

// C. Analytics & Financials
router.get('/:clinicId/analytics', analyticsController.getAnalytics);
router.get('/:clinicId/operational-dashboard', analyticsController.getOperationalDashboard);

// D. Staff Management
router.get('/:clinicId/staff', staffController.getStaff);
router.post('/:clinicId/staff', staffController.addStaff);
router.put('/:clinicId/staff/:staffId', staffController.updateStaff);
router.delete('/:clinicId/staff/:staffId', staffController.deleteStaff);

// E. Department Management
router.get('/:clinicId/departments', departmentController.getDepartments);
router.post('/:clinicId/departments', departmentController.addDepartment);
router.put('/:clinicId/departments/:serviceId', departmentController.updateDepartment);
router.delete('/:clinicId/departments/:serviceId', departmentController.deleteDepartment);

// F. Operations
router.get('/:clinicId/operations', operationsController.getOperations);
router.get('/:clinicId/outbreak-alerts', operationsController.getOutbreakAlerts);
router.post('/:clinicId/outbreak-alerts', operationsController.broadcastOutbreakAlert);

// G. Clinic Settings
router.get('/:clinicId/settings', settingsController.getClinicSettings);
router.put('/:clinicId/settings', settingsController.updateClinicSettings);

// H. Reports & Logs
router.get('/:clinicId/logs', reportsController.getLogs);
router.get('/:clinicId/reports/financial', reportsController.getFinancialReport);

module.exports = router;
