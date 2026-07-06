const db = require('../config/db');

class PatientRepository {
    async getPatientIdByUserId(userId) {
        const [rows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        return rows.length > 0 ? rows[0].id : null;
    }

    async getPendingRecommendations(patientId) {
        const [recommendations] = await db.query(
            `SELECT pr.id, pr.alert_title, pr.alert_description, pr.status, pr.generated_by,
                    s.name AS target_service, pr.created_at
             FROM preventive_recommendations pr
             JOIN services s ON pr.target_service_id = s.id
             WHERE pr.patient_id = ? AND pr.status = 'Pending'
             ORDER BY pr.created_at DESC`,
            [patientId]
        );
        return recommendations;
    }

    async dismissRecommendation(id, patientId) {
        await db.query(
            `UPDATE preventive_recommendations SET status = 'Read' WHERE id = ? AND patient_id = ?`,
            [id, patientId]
        );
    }

    async getServices() {
        const [services] = await db.query(`SELECT id, name FROM services ORDER BY name ASC`);
        return services;
    }

    async getClinicCities() {
        const [cities] = await db.query(`SELECT DISTINCT city FROM clinics WHERE verification_status = 'Approved' AND city IS NOT NULL ORDER BY city ASC`);
        return cities;
    }

    async getFamilyMembers(userId) {
        const [patients] = await db.query(
            `SELECT id, name, date_of_birth, gender, mrn 
             FROM patients 
             WHERE user_id = ?
             ORDER BY id ASC`,
            [userId]
        );
        return patients;
    }

    async addFamilyMember(userId, mrn, name, dateOfBirth, gender, bloodGroup) {
        const [result] = await db.execute(
            `INSERT INTO patients (user_id, mrn, name, date_of_birth, gender, blood_group)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, mrn, name, dateOfBirth || null, gender, bloodGroup || null]
        );
        return result.insertId;
    }
}

module.exports = new PatientRepository();
