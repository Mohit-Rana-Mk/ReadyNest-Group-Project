const db = require('../config/db');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

exports.uploadReport = async (req, res) => {
    try {
        const { patient_id, appointment_id, doctor_id } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        if (!patient_id || !appointment_id || !doctor_id) {
            return res.status(400).json({ success: false, message: 'Missing patient_id, appointment_id, or doctor_id' });
        }

        // Check if real keys are missing and fallback to a mock URL if so
        // (to prevent breaking if user hasn't set up Cloudinary yet)
        if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'demo') {
            console.warn("Cloudinary keys missing - using mock URL");
            const mockUrl = "https://res.cloudinary.com/demo/image/upload/v1/mock_report.pdf";
            
            await db.query(
                `INSERT INTO patient_reports (patient_id, appointment_id, doctor_id, report_url, file_name) VALUES (?, ?, ?, ?, ?)`,
                [patient_id, appointment_id, doctor_id, mockUrl, req.file.originalname]
            );

            return res.json({
                success: true,
                message: 'Report uploaded successfully (Mock Mode)',
                data: { report_url: mockUrl, file_name: req.file.originalname }
            });
        }

        // Actual upload via stream
        const uploadFromBuffer = (req) => {
            return new Promise((resolve, reject) => {
                let cld_upload_stream = cloudinary.uploader.upload_stream(
                    { folder: "healtrack_reports" },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
            });
        };

        const result = await uploadFromBuffer(req);

        // Save to DB
        await db.query(
            `INSERT INTO patient_reports (patient_id, appointment_id, doctor_id, report_url, file_name) VALUES (?, ?, ?, ?, ?)`,
            [patient_id, appointment_id, doctor_id, result.secure_url, req.file.originalname]
        );

        res.json({
            success: true,
            message: 'Report uploaded successfully',
            data: {
                report_url: result.secure_url,
                file_name: req.file.originalname
            }
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
};
