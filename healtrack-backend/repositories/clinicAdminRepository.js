const db = require('../config/db');

class ClinicAdminRepository {
    // --- Analytics Methods ---
    async getBasicAnalytics(clinicId, months) {
        const [footfallResult] = await db.query(
            `SELECT DATE_FORMAT(appointment_date, '%Y-%m') as month, COUNT(id) as patients 
             FROM appointments 
             WHERE clinic_id = ? AND appointment_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
             GROUP BY month ORDER BY month ASC`, 
             [clinicId, months]
        );

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

        const [noShowResult] = await db.query(
            `SELECT 
                COUNT(*) as total_appointments,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_appointments
             FROM appointments 
             WHERE clinic_id = ? AND appointment_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)`,
             [clinicId, months]
        );

        const [sourceResult] = await db.query(
            `SELECT booking_source, COUNT(*) as count 
             FROM appointments 
             WHERE clinic_id = ? AND appointment_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
             GROUP BY booking_source`,
             [clinicId, months]
        );

        return {
            footfall: footfallResult,
            revenue: revenueResult,
            noShow: noShowResult[0] || { total_appointments: 0, cancelled_appointments: 0 },
            sources: sourceResult
        };
    }

    async getOperationalDashboardStats(clinicId, filters) {
        const { start_date, end_date, departments, statuses } = filters;
        let conditions = ['a.clinic_id = ?'];
        let params = [clinicId];

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

        const repeatQuery = `
            SELECT COUNT(DISTINCT a.patient_id) as count
            FROM appointments a
            JOIN users d ON a.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            ${whereClause} AND a.patient_id IN (
                SELECT patient_id FROM appointments WHERE clinic_id = ? GROUP BY patient_id HAVING COUNT(id) > 1
            )
        `;
        const [repeatRows] = await db.query(repeatQuery, [...params, clinicId]);

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

        return {
            kpi: kpiRows[0] || { totalAppointments: 0, cancelledAppointments: 0, totalRevenue: 0, totalDoctors: 0 },
            repeatPatients: repeatRows[0]?.count || 0,
            utilizationRows,
            revenueRows,
            peakHoursRows,
            deptRows
        };
    }

    // --- Department Methods ---
    async getDepartments(clinicId) {
        const [departments] = await db.query(
            `SELECT s.id, s.name, cs.consultation_fee 
             FROM clinic_services cs
             JOIN services s ON cs.service_id = s.id
             WHERE cs.clinic_id = ?`,
             [clinicId]
        );
        return departments;
    }

    async getServiceByName(name) {
        const [existingService] = await db.execute(
            `SELECT id FROM services WHERE LOWER(name) = LOWER(?)`,
            [name]
        );
        return existingService.length > 0 ? existingService[0].id : null;
    }

    async createGlobalService(name) {
        const [result] = await db.execute(
            `INSERT INTO services (name) VALUES (?)`,
            [name]
        );
        return result.insertId;
    }

    async addClinicDepartment(clinicId, serviceId, consultationFee) {
        await db.execute(
            `INSERT INTO clinic_services (clinic_id, service_id, consultation_fee) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE consultation_fee = VALUES(consultation_fee)`,
             [clinicId, serviceId, consultationFee]
        );
    }

    async updateClinicDepartment(clinicId, serviceId, consultationFee) {
        await db.execute(
            `UPDATE clinic_services SET consultation_fee = ? WHERE clinic_id = ? AND service_id = ?`,
            [consultationFee, clinicId, serviceId]
        );
    }

    async deleteClinicDepartment(clinicId, serviceId) {
        await db.execute(
            `DELETE FROM clinic_services WHERE clinic_id = ? AND service_id = ?`,
            [clinicId, serviceId]
        );
    }

    async getAllGlobalServices() {
        const [services] = await db.query(`SELECT id, name FROM services`);
        return services;
    }

    // --- Operations Methods ---
    async getOperations(clinicId, dateString) {
        const [operations] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, 
                    p.name as patient_name, p.mrn as patient_mrn, du.name as doctor_name
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN users du ON a.doctor_id = du.id
             WHERE a.clinic_id = ? AND DATE(a.appointment_date) = ?
             ORDER BY a.appointment_date ASC`,
             [clinicId, dateString]
        );
        return operations;
    }

    async getOutbreakAlerts(clinicId) {
        const [rows] = await db.query(
            `SELECT id, disease, sector, severity, message, status, DATE_FORMAT(created_at, '%Y-%m-%d') as date
             FROM clinic_outbreaks
             WHERE clinic_id = ?
             ORDER BY created_at DESC`,
            [clinicId]
        );
        return rows;
    }

    async createOutbreakAlert(clinicId, data) {
        const { disease, sector, severity, message } = data;
        
        // 1. Insert into clinic_outbreaks
        const [result] = await db.execute(
            `INSERT INTO clinic_outbreaks (clinic_id, disease, sector, severity, message, status)
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [clinicId, disease, sector, severity, message]
        );
        
        // 2. Fetch target patients (who have appointments at this clinic)
        let [patients] = await db.query(
            `SELECT DISTINCT patient_id FROM appointments WHERE clinic_id = ?`,
            [clinicId]
        );
        
        // Fallback to all patients if no appointments at this clinic yet (for visibility in testing)
        if (patients.length === 0) {
            const [allPatients] = await db.query(`SELECT id as patient_id FROM patients`);
            patients = allPatients;
        }

        if (patients.length > 0) {
            // Find target service ID for General Medicine
            const [services] = await db.query(`SELECT id FROM services WHERE LOWER(name) LIKE '%general%' LIMIT 1`);
            const targetServiceId = services.length > 0 ? services[0].id : 2;

            const alertTitle = `Clinic Alert: ${disease} (${severity} Severity)`;
            const alertDescription = `${message} (Target sector: ${sector})`;

            // Insert preventive_recommendations and notifications for each patient
            for (const p of patients) {
                await db.execute(
                    `INSERT INTO preventive_recommendations (patient_id, alert_title, alert_description, target_service_id, status, generated_by)
                     VALUES (?, ?, ?, ?, 'Pending', 'Doctor_Flag')`,
                    [p.patient_id, alertTitle, alertDescription, targetServiceId]
                );

                await db.execute(
                    `INSERT INTO notifications (patient_id, message, status)
                     VALUES (?, ?, 'Unread')`,
                    [p.patient_id, `Health Alert: ${alertTitle}. ${alertDescription}`]
                );
            }
        }

        return {
            id: result.insertId,
            notifiedCount: patients.length
        };
    }


    // --- Reports & Logs Methods ---
    async getLogs(clinicId) {
        const [apptLogs] = await db.query(
            `SELECT a.id, a.status as type, CONCAT('Appointment ', a.status, ' for Patient MRN: ', p.mrn) as \`desc\`, a.appointment_date as date
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             WHERE a.clinic_id = ? AND a.status IN ('Cancelled', 'Completed')
             ORDER BY a.appointment_date DESC LIMIT 10`,
             [clinicId]
        );
        
        const [deptLogs] = await db.query(
            `SELECT cs.service_id as id, 'Department' as type, CONCAT('New Department Added: ', s.name) as \`desc\`, s.created_at as date
             FROM clinic_services cs
             JOIN services s ON cs.service_id = s.id
             WHERE cs.clinic_id = ?
             ORDER BY s.created_at DESC LIMIT 5`,
             [clinicId]
        );

        return { apptLogs, deptLogs };
    }

    async getFinancialReport(clinicId) {
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
        return ledger;
    }

    // --- Settings Methods ---
    async getSettings(clinicId) {
        const [settings] = await db.query(
            `SELECT name, license_number, address, latitude, longitude, opening_time, closing_time, operational_days 
             FROM clinics WHERE id = ?`,
             [clinicId]
        );
        return settings;
    }

    async updateSettings(clinicId, settingsData) {
        const { name, address, latitude, longitude, opening_time, closing_time, operational_days } = settingsData;
        let updateQuery = `UPDATE clinics SET name = COALESCE(?, name), address = COALESCE(?, address), 
                           latitude = ?, longitude = ?, opening_time = ?, closing_time = ?, operational_days = ? WHERE id = ?`;
        let params = [name, address, latitude || null, longitude || null, opening_time || null, closing_time || null, operational_days || null, clinicId];

        await db.execute(updateQuery, params);
    }

    // --- Staff Methods ---
    async getStaff(clinicId) {
        const [staff] = await db.query(
            `SELECT u.id, u.name, u.role, u.status, s.name as department, u.service_id
             FROM users u
             LEFT JOIN doctor_schedules ds ON u.id = ds.doctor_id
             LEFT JOIN services s ON u.service_id = s.id
             WHERE u.role IN ('Doctor', 'ClinicStaff') 
             AND (ds.clinic_id = ? OR (u.role = 'ClinicStaff' AND u.clinic_id = ?))
             GROUP BY u.id, u.name, u.role, u.status, s.name, u.service_id`,
             [clinicId, clinicId]
        );
        return staff;
    }

    async addStaffMember(payload) {
        const { name, email, phone, role, service_id, hashedPassword, clinicId } = payload;
        
        const [result] = await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status, service_id, clinic_id) VALUES (?, ?, ?, ?, ?, 'Active', ?, ?)`,
            [name, email, phone, hashedPassword, role, role === 'Doctor' ? service_id : null, role === 'ClinicStaff' ? clinicId : null]
        );
        
        const newUserId = result.insertId;

        if (role === 'Doctor') {
            await db.execute(
                `INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time) VALUES (?, ?, 'Monday', '09:00:00', '17:00:00')`,
                [newUserId, clinicId]
            );
        }

        return newUserId;
    }

    async updateStaffMember(staffId, payload) {
        const { name, role, status, service_id } = payload;
        await db.execute(
            `UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), status = COALESCE(?, status), service_id = CASE WHEN ? = 'Doctor' THEN COALESCE(?, service_id) ELSE NULL END WHERE id = ?`,
            [name, role, status, role, service_id, staffId]
        );
    }
}

module.exports = new ClinicAdminRepository();
