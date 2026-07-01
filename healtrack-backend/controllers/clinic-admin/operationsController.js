const db = require('../../config/db');

exports.getOperations = async (req, res) => {
    const { clinicId } = req.params;
    try {
        // High-level view of today's appointments
        const [operations] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, 
                    p.name as patient_name, p.mrn as patient_mrn, du.name as doctor_name
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN users du ON a.doctor_id = du.id
             WHERE a.clinic_id = ? AND DATE(a.appointment_date) = CURDATE()
             ORDER BY a.appointment_date ASC`,
             [clinicId]
        );
        res.status(200).json(operations);
    } catch (error) {
        console.error('Operations Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
