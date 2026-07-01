const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo', 
  api_key: process.env.CLOUDINARY_API_KEY || '1234567890', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret' 
});

module.exports = cloudinary;
