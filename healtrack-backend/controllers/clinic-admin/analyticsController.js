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

        // Booking Sources Distribution
        const [sourceResult] = await db.query(
            `SELECT booking_source, COUNT(*) as count 
             FROM appointments 
             WHERE clinic_id = ? AND appointment_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
             GROUP BY booking_source`,
             [clinicId, months]
        );

        res.status(200).json({ footfall: footfallResult, revenue: revenueResult, noShow: noShowData, sources: sourceResult });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getOperationalDashboard = async (req, res) => {
    const { clinicId } = req.params;
    const { start_date, end_date, departments, statuses } = req.query;

    try {
        let conditions = ['a.clinic_id = ?'];
        let params = [clinicId];

        // Apply filters
        if (start_date) {
            conditions.push('a.appointment_date >= ?');
            params.push(`${start_date} 00:00:00`);
        }
        if (end_date) {
            conditions.push('a.appointment_date <= ?');
            params.push(`${end_date} 23:59:59`);
        }
        if (departments) {
            const deptList = departments.split(',');
            conditions.push('s.name IN (?)');
            params.push(deptList);
        }
        if (statuses) {
            const statusList = statuses.split(',');
            conditions.push('a.status IN (?)');
            params.push(statusList);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. KPI Stats: Total Appts, No-Show Rate, Total Revenue, Total Doctors
        // SQL query with proper joins
        const kpiQuery = `
            SELECT 
                COUNT(a.id) as totalAppointments,
                SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelledAppointments,
                SUM(CASE WHEN a.status = 'Completed' THEN cs.consultation_fee ELSE 0 END) as totalRevenue,
                COUNT(DISTINCT a.doctor_id) as totalDoctors
            FROM appointments a
            JOIN users d ON a.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            LEFT JOIN clinic_services cs ON a.clinic_id = cs.clinic_id AND d.service_id = cs.service_id
            ${whereClause}
        `;

        const [kpiRows] = await db.query(kpiQuery, params);
        const kpi = kpiRows[0] || { totalAppointments: 0, cancelledAppointments: 0, totalRevenue: 0, totalDoctors: 0 };
        
        const totalRevenue = parseFloat(kpi.totalRevenue || 0);
        const totalAppointments = parseInt(kpi.totalAppointments || 0);
        const cancelledAppointments = parseInt(kpi.cancelledAppointments || 0);
        const totalDoctors = parseInt(kpi.totalDoctors || 0);

        const noShowRate = totalAppointments > 0 
            ? ((cancelledAppointments / totalAppointments) * 100).toFixed(2) 
            : '0.00';

        // 2. Doctor Utilization (Bar Chart: Count of AppointmentID by Doctor)
        const utilizationQuery = `
            SELECT d.name as doctor_name, COUNT(a.id) as count
            FROM appointments a
            JOIN users d ON a.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            ${whereClause}
            GROUP BY d.name
            ORDER BY count DESC
        `;
        const [utilizationRows] = await db.query(utilizationQuery, params);

        // 3. Revenue Overview (Line Chart: Revenue over time)
        const revenueOverTimeQuery = `
            SELECT DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as date, SUM(cs.consultation_fee) as revenue
            FROM appointments a
            JOIN users d ON a.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            LEFT JOIN clinic_services cs ON a.clinic_id = cs.clinic_id AND d.service_id = cs.service_id
            ${whereClause} AND a.status = 'Completed'
            GROUP BY date
            ORDER BY date ASC
        `;
        const [revenueRows] = await db.query(revenueOverTimeQuery, params);

        // 4. Peak Hours (Line Chart: Appointments count by Hour)
        const peakHoursQuery = `
            SELECT HOUR(a.appointment_date) as hour, COUNT(a.id) as count
            FROM appointments a
            JOIN users d ON a.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            ${whereClause}
            GROUP BY hour
            ORDER BY hour ASC
        `;
        const [peakHoursRows] = await db.query(peakHoursQuery, params);

        // 5. Appointments Overview (Horizontal Bar Chart: Count by Department)
        const apptsByDeptQuery = `
            SELECT s.name as department_name, COUNT(a.id) as count
            FROM appointments a
            JOIN users d ON a.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            ${whereClause}
            GROUP BY s.name
            ORDER BY count DESC
        `;
        const [deptRows] = await db.query(apptsByDeptQuery, params);

        // Format outputs nicely
        res.status(200).json({
            success: true,
            kpis: {
                noShowRate: parseFloat(noShowRate),
                totalAppointments,
                totalRevenue,
                totalDoctors
            },
            doctorUtilization: utilizationRows,
            revenueOverview: revenueRows,
            peakHours: peakHoursRows.map(r => ({ hour: `${r.hour}:00`, count: r.count })),
            appointmentsOverview: deptRows
        });

    } catch (error) {
        console.error('Operational Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};
