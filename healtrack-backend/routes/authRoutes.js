const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/signup-patient', authController.signupPatient);
router.post('/register-clinic', authController.registerClinic);

module.exports = router;
