const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/signup-patient', authController.signupPatient);
router.post('/register-clinic', authController.registerClinic);
router.put('/language', authMiddleware(), authController.updateLanguage);

module.exports = router;
