const db = require('../../config/db');

exports.getAnalytics = async (req, res) => {
    const { clinicId } = req.params;
    const months = parseInt(req.query.months) || 6; // Default to 6 months
    
    try {
        // Patient Footfall: COUNT(id) from appointments grouped by month
        const [footfallResult] = await db.query(
            `SELECT DATE_FORMAT(appointment_date, '%Y-%m') as month, COUNT(id) as patients 
             FROM appointments 
             WHERE clinic_id = ? AND appointment_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
             GROUP BY month ORDER BY month ASC`, 
             [clinicId, months]
        );

        // Total Revenue: SUM of consultation_fee for 'Completed' appointments
        const [revenueResult] = await db.query(
            `SELECT DATE_FORMAT(a.appointment_date, '%Y-%m') as month, 
                    SUM(
                        (SELECT AVG(consultation_fee) FROM clinic_services cs WHERE cs.clinic_id = a.clinic_id)
                    ) as revenue
             FROM appointments a
             WHERE a.clinic_id = ? AND a.status = 'Completed' AND a.appointment_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
             GROUP BY month ORDER BY month ASC`,
             [clinicId, months]
        );

        // No-Show Rate: Total vs Cancelled appointments in timeframe
        const [noShowResult] = await db.query(
            `SELECT 
                COUNT(*) as total_appointments,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_appointments
             FROM appointments 
             WHERE clinic_id = ? AND appointment_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)`,
             [clinicId, months]
        );

        const noShowData = noShowResult[0] || { total_appointments: 0, cancelled_appointments: 0 };

        res.status(200).json({ footfall: footfallResult, revenue: revenueResult, noShow: noShowData });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
