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

    async createClinic(name, license_number, address, city, postal_code, latitude, longitude) {
        await db.execute(
            `INSERT INTO clinics (name, license_number, address, city, postal_code, latitude, longitude, verification_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')`,
            [name, license_number, address, city, postal_code, latitude, longitude]
        );
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
}

module.exports = new AdminRepository();
