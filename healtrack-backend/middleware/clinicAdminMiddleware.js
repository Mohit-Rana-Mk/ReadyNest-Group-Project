const db = require('../config/db');

const verifyClinicAccess = async (req, res, next) => {
    try {
        const { clinicId, staffId, serviceId } = req.params;

        // 1. Verify Clinic Admin is accessing their own clinic
        if (clinicId) {
            if (parseInt(clinicId) !== parseInt(req.user.clinic_id)) {
                return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access to clinic data.' });
            }
        }

        // 2. Verify Staff belongs to the clinic (if staffId is provided)
        if (staffId) {
            const [staffRows] = await db.query(
                `SELECT u.id 
                 FROM users u
                 LEFT JOIN doctor_schedules ds ON u.id = ds.doctor_id
                 WHERE u.id = ? AND u.role IN ('Doctor', 'ClinicStaff')
                 AND (ds.clinic_id = ? OR u.clinic_id = ?)`,
                [staffId, req.user.clinic_id, req.user.clinic_id]
            );
            if (staffRows.length === 0) {
                return res.status(403).json({ success: false, message: 'Forbidden: Staff member does not belong to this clinic.' });
            }
        }

        // 3. Verify Department/Service belongs to the clinic (if serviceId is provided)
        if (serviceId) {
            const [serviceRows] = await db.query(
                `SELECT clinic_id FROM clinic_services WHERE clinic_id = ? AND service_id = ?`,
                [req.user.clinic_id, serviceId]
            );
            if (serviceRows.length === 0) {
                return res.status(403).json({ success: false, message: 'Forbidden: Department does not exist in this clinic.' });
            }
        }

        next();
    } catch (err) {
        console.error('Clinic Admin Verification Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = verifyClinicAccess;
