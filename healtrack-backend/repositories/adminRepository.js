const db = require('../config/db');

class AdminRepository {
    async getPendingClinics() {
        const [clinics] = await db.query(
            `SELECT c.id, c.name, c.license_number, c.address, c.city, c.postal_code, c.created_at, c.latitude, c.longitude,
                    u.name as admin_name, u.email as admin_email, u.phone as admin_phone
             FROM clinics c
             LEFT JOIN users u ON c.id = u.clinic_id AND u.role = 'ClinicAdmin'
             WHERE c.verification_status = 'Pending' 
             ORDER BY c.created_at DESC`
        );
        return clinics;
    }

    async updateClinicVerificationStatus(clinicId, status) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE clinics SET verification_status = ? WHERE id = ?`,
                [status, clinicId]
            );

            if (status === 'Approved') {
                await connection.execute(
                    `UPDATE users SET status = 'Active' WHERE clinic_id = ?`,
                    [clinicId]
                );
            } else if (status === 'Delisted' || status === 'Suspended') {
                await connection.execute(
                    `UPDATE users SET status = 'Suspended' WHERE clinic_id = ?`,
                    [clinicId]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async createClinic(clinicData, adminData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { name, license_number, address, city, postal_code, latitude, longitude } = clinicData;
            const [result] = await connection.execute(
                `INSERT INTO clinics (name, license_number, address, city, postal_code, latitude, longitude, verification_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')`,
                [name, license_number, address, city, postal_code, latitude, longitude]
            );

            const clinicId = result.insertId;

            if (adminData) {
                const { admin_name, admin_email, admin_phone, hashedPassword } = adminData;
                await connection.execute(
                    `INSERT INTO users (name, email, phone, password, role, status, clinic_id)
                     VALUES (?, ?, ?, ?, 'ClinicAdmin', 'Active', ?)`,
                    [admin_name, admin_email, admin_phone, hashedPassword, clinicId]
                );
            }

            await connection.commit();
            return clinicId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getEpidemiologyLocations(days) {
        const [locations] = await db.query(
            `SELECT c.id, c.name, 
                    COALESCE(c.latitude, 28.6139) as latitude, 
                    COALESCE(c.longitude, 77.2090) as longitude, 
                    p.diagnosis, COUNT(p.id) as count,
                    CASE WHEN COUNT(p.id) > 10 THEN 'High' ELSE 'Medium' END as risk
             FROM clinics c
             JOIN appointments a ON c.id = a.clinic_id
             JOIN prescriptions p ON a.id = p.appointment_id
             WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY c.id, c.name, latitude, longitude, p.diagnosis
             HAVING count > 0
             ORDER BY count DESC`,
            [days]
        );
        return locations;
    }

    async getEpidemiologyTrends(days) {
        const [trends] = await db.query(
            `SELECT diagnosis as label, COUNT(id) as count 
             FROM prescriptions 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) 
             GROUP BY diagnosis 
             ORDER BY count DESC 
             LIMIT 5`,
            [days]
        );
        return trends;
    }

    async getAiTriageStats() {
        const [triageStats] = await db.query(
            `SELECT predicted_risk, COUNT(id) as count 
             FROM ai_triage_logs 
             GROUP BY predicted_risk`
        );
        return triageStats;
    }

    async getPreventiveRecommendationsCount() {
        const [[{ count }]] = await db.query(
            `SELECT COUNT(id) as count 
             FROM preventive_recommendations`
        );
        return count;
    }

    async getEcosystemCounts() {
        const [[{ totalPatients }]] = await db.query(`SELECT COUNT(*) as totalPatients FROM patients`);
        const [[{ totalClinics }]] = await db.query(`SELECT COUNT(*) as totalClinics FROM clinics WHERE verification_status = 'Approved'`);
        const [[{ totalAppointments }]] = await db.query(`SELECT COUNT(*) as totalAppointments FROM appointments`);
        return { totalPatients, totalClinics, totalAppointments };
    }

    async getClinicReviews() {
        const [reviews] = await db.query(
            `SELECT c.id, c.name, c.verification_status, AVG(cr.rating) as rating, COUNT(cr.id) as review_count 
             FROM clinics c
             LEFT JOIN clinic_reviews cr ON c.id = cr.clinic_id 
             WHERE c.verification_status IN ('Approved', 'Suspended')
             GROUP BY c.id, c.name, c.verification_status
             ORDER BY rating DESC`
        );
        return reviews;
    }
    async getAllPatients() {
        const [patients] = await db.query(
            `SELECT p.id as patient_id, p.mrn, p.name, p.gender, p.date_of_birth,
                    u.id as user_id, u.email, u.phone, u.status as user_status, u.created_at
             FROM patients p
             JOIN users u ON p.user_id = u.id
             ORDER BY u.created_at DESC`
        );
        return patients;
    }

    async updatePatientStatus(userId, status) {
        await db.query(
            `UPDATE users SET status = ? WHERE id = ? AND role = 'Patient'`,
            [status, userId]
        );
    }

    async deletePatient(patientId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [patients] = await connection.execute(
                `SELECT user_id FROM patients WHERE id = ?`,
                [patientId]
            );

            if (patients.length > 0) {
                const userId = patients[0].user_id;

                await connection.execute(`
                    DELETE rf FROM refund_requests rf 
                    JOIN payments py ON rf.payment_id = py.id 
                    WHERE py.patient_id = ?
                `, [patientId]);

                await connection.execute(`DELETE FROM payments WHERE patient_id = ?`, [patientId]);
                await connection.execute(`DELETE FROM patient_reports WHERE patient_id = ?`, [patientId]);
                await connection.execute(`DELETE FROM appointments WHERE patient_id = ?`, [patientId]);
                await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async deleteClinic(clinicId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [appts] = await connection.execute(
                `SELECT id FROM appointments WHERE clinic_id = ?`,
                [clinicId]
            );
            const apptIds = appts.map(a => a.id);

            if (apptIds.length > 0) {
                await connection.execute(`
                    DELETE rf FROM refund_requests rf
                    JOIN payments py ON rf.payment_id = py.id
                    WHERE py.appointment_id IN (${apptIds.join(',')})
                `);

                await connection.execute(`
                    DELETE FROM payments WHERE appointment_id IN (${apptIds.join(',')})
                `);

                await connection.execute(`
                    DELETE FROM patient_reports WHERE appointment_id IN (${apptIds.join(',')})
                `);

                await connection.execute(`
                    DELETE FROM appointments WHERE clinic_id = ?
                `, [clinicId]);
            }

            await connection.execute(`DELETE FROM settlement_records WHERE clinic_id = ?`, [clinicId]);
            await connection.execute(`DELETE FROM clinic_bank_accounts WHERE clinic_id = ?`, [clinicId]);
            await connection.execute(`DELETE FROM clinic_outbreaks WHERE clinic_id = ?`, [clinicId]);
            await connection.execute(`DELETE FROM clinic_services WHERE clinic_id = ?`, [clinicId]);
            await connection.execute(`DELETE FROM clinic_reviews WHERE clinic_id = ?`, [clinicId]);
            await connection.execute(`DELETE FROM clinics WHERE id = ?`, [clinicId]);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getClinicDetails(clinicId) {
        const [[clinic]] = await db.query(
            `SELECT id, name, license_number, address, city, postal_code, latitude, longitude, verification_status 
             FROM clinics WHERE id = ?`,
            [clinicId]
        );
        if (!clinic) return null;

        // Doctors
        const [doctors] = await db.query(
            `SELECT u.id, u.name, u.email, u.phone, u.status, s.name as department_name, u.service_id
             FROM users u
             LEFT JOIN services s ON u.service_id = s.id
             LEFT JOIN (SELECT DISTINCT doctor_id, clinic_id FROM doctor_schedules) ds ON ds.doctor_id = u.id
             WHERE u.role = 'Doctor' AND (u.clinic_id = ? OR ds.clinic_id = ?)`,
            [clinicId, clinicId]
        );

        // Receptionists
        const [receptionists] = await db.query(
            `SELECT u.id, u.name, u.email, u.phone, u.status
             FROM users u
             WHERE u.role = 'ClinicStaff' AND u.clinic_id = ?`,
            [clinicId]
        );

        // Medicine Staff
        const [medicineStaff] = await db.query(
            `SELECT u.id, u.name, u.email, u.phone, u.status
             FROM users u
             WHERE u.role = 'Medicine' AND u.clinic_id = ?`,
            [clinicId]
        );

        // Departments (clinic services)
        const [departments] = await db.query(
            `SELECT cs.service_id, s.name, cs.consultation_fee
             FROM clinic_services cs
             JOIN services s ON cs.service_id = s.id
             WHERE cs.clinic_id = ?`,
            [clinicId]
        );

        // Available services in general
        const [availableServices] = await db.query(
            `SELECT id, name, description FROM services`
        );

        return {
            clinic,
            doctors,
            receptionists,
            medicineStaff,
            departments,
            availableServices
        };
    }

    async updateClinicDetails(clinicId, details) {
        const { name, license_number, address, city, postal_code, latitude, longitude } = details;
        await db.execute(
            `UPDATE clinics 
             SET name = ?, license_number = ?, address = ?, city = ?, postal_code = ?, latitude = ?, longitude = ?
             WHERE id = ?`,
            [name, license_number, address, city, postal_code, latitude || 0, longitude || 0, clinicId]
        );
    }

    async addClinicDepartment(clinicId, serviceId, fee) {
        await db.execute(
            `INSERT INTO clinic_services (clinic_id, service_id, consultation_fee) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE consultation_fee = ?`,
            [clinicId, serviceId, fee, fee]
        );
    }

    async removeClinicDepartment(clinicId, serviceId) {
        await db.execute(
            `DELETE FROM clinic_services WHERE clinic_id = ? AND service_id = ?`,
            [clinicId, serviceId]
        );
    }

    async updateUserStatus(userId, status) {
        await db.execute(
            `UPDATE users SET status = ? WHERE id = ? AND role IN ('Doctor', 'ClinicStaff', 'Medicine')`,
            [status, userId]
        );
    }

    async deleteUser(userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(`UPDATE appointments SET doctor_id = NULL WHERE doctor_id = ?`, [userId]);
            await connection.execute(`DELETE FROM doctor_schedules WHERE doctor_id = ?`, [userId]);
            await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new AdminRepository();
