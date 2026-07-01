const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

// Mount auth middleware to protect all patient routes
// router.use(authMiddleware); // DISABLED FOR TESTING

// A. Home & Preventive Analytics
router.get('/:patientId/recommendations', patientController.getRecommendations);
router.get('/services', patientController.getServices);

// B. Nearby Clinics
router.get('/clinics/cities', patientController.getClinicCities);
router.get('/clinics/nearby', patientController.getNearbyClinics);

// C. AI Triage
router.post('/triage', patientController.submitTriage);

// D. Appointment History
router.get('/:patientId/appointments', patientController.getAppointments);
router.get('/appointments/family', patientController.getFamilyAppointments);

// E. Family Members
router.get('/family', patientController.getFamilyMembers);
router.post('/family', patientController.addFamilyMember);

// C. Clinic Details
router.get('/clinics/:clinicId/wait-time', patientController.getClinicWaitTime);
router.get('/clinics/:clinicId/doctors', patientController.getClinicDoctors);

// F. Bookings
router.post('/appointments', patientController.bookAppointment);
router.put('/appointments/:appointmentId/cancel', patientController.cancelAppointment);
router.put('/appointments/:appointmentId/reschedule', patientController.rescheduleAppointment);

// G. Reviews
router.post('/reviews', patientController.submitClinicReview);

module.exports = router;
