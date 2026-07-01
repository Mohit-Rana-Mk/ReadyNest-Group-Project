const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const multer = require('multer');

// Configure multer to use memory storage (file buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define upload endpoint
router.post('/report', upload.single('report_file'), uploadController.uploadReport);

module.exports = router;
