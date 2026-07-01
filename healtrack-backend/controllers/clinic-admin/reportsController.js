const db = require('../../config/db');

exports.getLogs = async (req, res) => {
    const { clinicId } = req.params;
    try {
        // Dynamic logs from appointments and clinic_services
        // 1. Get recent cancelled/completed appointments
        const [apptLogs] = await db.query(
            `SELECT a.id, a.status as type, CONCAT('Appointment ', a.status, ' for Patient MRN: ', p.mrn) as \`desc\`, a.appointment_date as date
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             WHERE a.clinic_id = ? AND a.status IN ('Cancelled', 'Completed')
             ORDER BY a.appointment_date DESC LIMIT 10`,
             [clinicId]
        );
        
        // 2. Get recent departments added
        const [deptLogs] = await db.query(
            `SELECT cs.service_id as id, 'Department' as type, CONCAT('New Department Added: ', s.name) as \`desc\`, s.created_at as date
             FROM clinic_services cs
             JOIN services s ON cs.service_id = s.id
             WHERE cs.clinic_id = ?
             ORDER BY s.created_at DESC LIMIT 5`,
             [clinicId]
        );

        // Combine, sort, and return
        let allLogs = [...apptLogs, ...deptLogs];
        allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.status(200).json(allLogs.slice(0, 15)); // Return top 15
    } catch (error) {
        console.error('Fetch Logs Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getFinancialReport = async (req, res) => {
    const { clinicId } = req.params;
    try {
        // Full ledger of completed appointments
        const [ledger] = await db.query(
            `SELECT a.id as appointment_id, DATE_FORMAT(a.appointment_date, '%Y-%m-%d %H:%i') as date, 
                    p.name as patient_name, du.name as doctor_name, 
                    COALESCE(cs.consultation_fee, 0) as fee
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users du ON a.doctor_id = du.id
             LEFT JOIN clinic_services cs ON cs.clinic_id = a.clinic_id AND cs.service_id = du.service_id
             WHERE a.clinic_id = ? AND a.status = 'Completed'
             ORDER BY a.appointment_date DESC`,
             [clinicId]
        );
        
        res.status(200).json(ledger);
    } catch (error) {
        console.error('Fetch Financial Report Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
