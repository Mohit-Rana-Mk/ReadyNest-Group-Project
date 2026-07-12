const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer to use memory storage (file buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define upload endpoint with authentication checks
router.post('/report', authMiddleware(['Doctor', 'ClinicStaff']), upload.single('report_file'), uploadController.uploadReport);

module.exports = router;
