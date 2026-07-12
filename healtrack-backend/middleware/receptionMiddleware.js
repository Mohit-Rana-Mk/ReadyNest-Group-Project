const db = require('../config/db');

const verifyClinicStaffAccess = async (req, res, next) => {
    try {
        const { clinicId, appointmentId } = req.params;

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
