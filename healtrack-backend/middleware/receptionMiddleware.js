const db = require('../config/db');

const verifyClinicStaffAccess = async (req, res, next) => {
    try {
        let { clinicId, appointmentId } = req.params;

        // Fallback: Parse path parameters if req.params is not populated yet in router.use middleware
        const pathParts = req.path.split('/').filter(Boolean);
        if (pathParts[0] && /^\d+$/.test(pathParts[0])) {
            clinicId = clinicId || pathParts[0];
        }
        if (pathParts[1] === 'appointments' && pathParts[2] && /^\d+$/.test(pathParts[2])) {
            appointmentId = appointmentId || pathParts[2];
        }

        // 1. Verify ClinicStaff is accessing their own clinic
        if (clinicId) {
            if (parseInt(clinicId) !== parseInt(req.user.clinic_id)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access to clinic data.' });
            }
        }

        // 2. Verify Appointment belongs to this clinic (if appointmentId is provided)
        if (appointmentId) {
            const [apptRows] = await db.query(
                `SELECT id FROM appointments WHERE id = ? AND clinic_id = ?`,
                [appointmentId, req.user.clinic_id]
            );
            if (apptRows.length === 0) {
                return res.status(403).json({ success: false, message: 'Forbidden: Appointment does not belong to this clinic.' });
            }
        }

        next();
    } catch (err) {
        console.error('Clinic Staff Verification Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = verifyClinicStaffAccess;
