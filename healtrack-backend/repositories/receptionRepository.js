const db = require('../config/db');

class ReceptionRepository {
    async getQueue(clinicId, dateString) {
        const [queue] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, 
                    DATE_FORMAT(a.appointment_date, '%h:%i %p') as time,
                    p.name as patientName, p.mrn as patientMrn, du.name as doctorName
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN users du ON a.doctor_id = du.id
             WHERE a.clinic_id = ? AND DATE(a.appointment_date) = ?
             ORDER BY a.appointment_date ASC`,
             [clinicId, dateString]
        );
        return queue;
    }

    async getActiveDoctors(clinicId) {
        const [doctors] = await db.query(
            `SELECT u.id, u.name, COALESCE(cs.consultation_fee, 0) as consultation_fee 
             FROM users u
             JOIN doctor_schedules ds ON u.id = ds.doctor_id
             LEFT JOIN clinic_services cs ON cs.clinic_id = ds.clinic_id AND cs.service_id = u.service_id
             WHERE ds.clinic_id = ? AND u.status = 'Active'
             GROUP BY u.id, consultation_fee`,
             [clinicId]
        );
        return doctors;
    }

    async checkInPatient(appointmentId, clinicId) {
        await db.execute(
            `UPDATE appointments SET status = 'Checked-In' WHERE id = ? AND clinic_id = ?`,
            [appointmentId, clinicId]
        );
    }

    async updateStatus(appointmentId, clinicId, status) {
        await db.execute(
            `UPDATE appointments SET status = ? WHERE id = ? AND clinic_id = ?`,
            [status, appointmentId, clinicId]
        );
    }

    async lookupPatientByPhone(phone) {
        const [users] = await db.query(`SELECT id, name FROM users WHERE phone = ?`, [phone]);
        if (users.length === 0) {
            return { exists: false };
        }

        const userId = users[0].id;
        const [patients] = await db.query(`SELECT id, name, date_of_birth, mrn FROM patients WHERE user_id = ?`, [userId]);

        return { 
            exists: true, 
            user: users[0],
            patients 
        };
    }

    async registerWalkIn(clinicId, payload) {
        const { phone, doctor_id, patient_id, new_patient_name, dob, pre_remarks } = payload;
        let finalPatientId = patient_id;

        if (!finalPatientId) {
            let userId;
            
            if (phone) {
                const [existingUsers] = await db.query(`SELECT id FROM users WHERE phone = ?`, [phone]);
                if (existingUsers.length > 0) {
                    userId = existingUsers[0].id;
                }
            }

            if (!userId) {
                const email = `walkin_${Date.now()}@temp.com`;
                const finalPhone = phone || `walkin_${Date.now()}`;
                const [userResult] = await db.execute(
                    `INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, 'walkin123', 'Patient', 'Active')`,
                    [new_patient_name, email, finalPhone]
                );
                userId = userResult.insertId;
            }

            const [maxIdResult] = await db.query(`SELECT MAX(id) as maxId FROM patients`);
            const nextId = (maxIdResult[0].maxId || 0) + 1;
            const mrn = `PT-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

            const [patientResult] = await db.execute(
                `INSERT INTO patients (user_id, name, date_of_birth, gender, mrn) VALUES (?, ?, ?, 'Other', ?)`,
                [userId, new_patient_name, dob || null, mrn]
            );
            finalPatientId = patientResult.insertId;
        }

        const finalPreRemarks = pre_remarks || 'Walk-In Registration';

        const [result] = await db.execute(
            `INSERT INTO appointments (clinic_id, patient_id, doctor_id, appointment_date, status, booking_source, pre_remarks) 
             VALUES (?, ?, ?, NOW(), 'Checked-In', 'Walk-in', ?)`,
            [clinicId, finalPatientId, doctor_id, finalPreRemarks]
        );
        return {
            appointmentId: result.insertId,
            doctor_id,
            patientName: new_patient_name || (await db.query(`SELECT name FROM patients WHERE id = ?`, [finalPatientId]))[0][0]?.name
        };
    }

    async getAppointmentDetails(appointmentId) {
        const [rows] = await db.query(
            `SELECT a.doctor_id, p.name as patientName, a.status 
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             WHERE a.id = ?`,
            [appointmentId]
        );
        return rows[0];
    }
}

module.exports = new ReceptionRepository();
