const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

// Mount auth middleware to protect all patient routes
router.use(authMiddleware(['Patient']));

// A. Home & Preventive Analytics
router.get('/recommendations', patientController.getRecommendations);
router.put('/recommendations/:id/dismiss', patientController.dismissRecommendation);
router.get('/services', patientController.getServices);

// B. Nearby Clinics
router.get('/clinics/cities', patientController.getClinicCities);
router.get('/clinics/nearby', patientController.getNearbyClinics);

// C. AI Triage
router.post('/triage', patientController.submitTriage);
router.post('/parkinsons/predict', patientController.predictParkinsons);

// D. Appointment History
router.get('/appointments/family', patientController.getFamilyAppointments);
router.get('/:patientId/appointments', patientController.getAppointments);

// E. Family Members
router.get('/family', patientController.getFamilyMembers);
router.post('/family', patientController.addFamilyMember);

// Clinic Details
router.get('/clinics/:clinicId/wait-time', patientController.getClinicWaitTime);
router.get('/clinics/:clinicId/doctors', patientController.getClinicDoctors);

// F. Bookings
router.post('/appointments', patientController.bookAppointment);
router.put('/appointments/:appointmentId/cancel', patientController.cancelAppointment);
router.put('/appointments/:appointmentId/reschedule', patientController.rescheduleAppointment);

// G. Reviews
router.post('/reviews', patientController.submitClinicReview);

// H. Patient Profile & Settings
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);
router.put('/profile/password', patientController.changePassword);
router.post('/profile/image', upload.single('profile_image'), patientController.uploadProfileImage);

module.exports = router;
