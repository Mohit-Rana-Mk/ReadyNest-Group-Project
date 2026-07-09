const db = require('../config/db');

class DoctorRepository {
    async getAppointments(doctorId, dateFilter) {
        let dateCondition = '';
        if (dateFilter === 'today') {
            const today = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(today.getTime() + istOffset);
            const dateString = istDate.toISOString().split('T')[0];
            dateCondition = `AND DATE(a.appointment_date) = '${dateString}'`;
        } else if (dateFilter === 'past_week') {
            dateCondition = 'AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        } else if (dateFilter === 'past_month') {
            dateCondition = 'AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        }

        const [appointments] = await db.query(`
            SELECT 
                a.id AS appointment_id,
                a.doctor_id,
                a.appointment_date,
                a.status,
                a.booking_source,
                a.consultation_type,
                a.meeting_link,
                a.pre_remarks,
                a.post_remarks,
                p.id AS patient_id,
                p.name AS patient_name,
                u.email AS patient_email,
                u.phone AS patient_phone,
                p.date_of_birth,
                p.gender,
                p.blood_group,
                p.emergency_contact,
                v.weight_kg,
                v.height_cm,
                v.systolic_bp,
                v.diastolic_bp,
                v.blood_sugar_mgdl,
                v.pulse_rate
            FROM appointments a
            INNER JOIN patients p ON a.patient_id = p.id
            INNER JOIN users u ON p.user_id = u.id
            LEFT JOIN patient_vitals v ON a.id = v.appointment_id
            WHERE a.doctor_id = ? AND a.status NOT IN ('Cancelled', 'Canceled') ${dateCondition}
            ORDER BY a.appointment_date ASC
        `, [doctorId]);

        return appointments;
    }

    async getPatientVitals(patientId) {
        const [vitals] = await db.query(`
            SELECT * FROM patient_vitals 
            WHERE patient_id = ? 
            ORDER BY recorded_at DESC
        `, [patientId]);
        return vitals;
    }

    async getPatientPrescriptions(patientId) {
        const [prescriptions] = await db.query(`
            SELECT 
                pr.id AS prescription_id,
                pr.diagnosis,
                pr.created_at,
                a.id AS appointment_id,
                a.appointment_date,
                a.post_remarks,
                u.name AS doctor_name
            FROM prescriptions pr
            INNER JOIN appointments a ON pr.appointment_id = a.id
            INNER JOIN users u ON pr.doctor_id = u.id
            WHERE pr.patient_id = ?
            ORDER BY pr.created_at DESC
        `, [patientId]);
        return prescriptions;
    }

    async getPrescriptionItems(prescriptionIds) {
        if (prescriptionIds.length === 0) return [];
        const [items] = await db.query(`
            SELECT * FROM prescription_items 
            WHERE prescription_id IN (?)
        `, [prescriptionIds]);
        return items;
    }

    async completeConsultationTransaction(payload) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { doctorId, appointmentId, patientId, diagnosis, preRemarks, postRemarks, vitals, prescriptionItems } = payload;

            await connection.query(`
                UPDATE appointments 
                SET status = 'Completed', pre_remarks = ?, post_remarks = ? 
                WHERE id = ?
            `, [preRemarks || '', postRemarks || '', appointmentId]);

            const [prescResult] = await connection.query(`
                INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, diagnosis) 
                VALUES (?, ?, ?, ?)
            `, [appointmentId, patientId, doctorId, diagnosis]);

            const prescriptionId = prescResult.insertId;

            if (Array.isArray(prescriptionItems) && prescriptionItems.length > 0) {
                const insertValues = prescriptionItems.map(item => [
                    prescriptionId,
                    item.medicine_name,
                    item.dosage,
                    item.frequency,
                    item.duration,
                    item.instructions || ''
                ]);

                await connection.query(`
                    INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) 
                    VALUES ?
                `, [insertValues]);
            }

            if (vitals && Object.keys(vitals).length > 0) {
                const { weight_kg, height_cm, systolic_bp, diastolic_bp, blood_sugar_mgdl, pulse_rate } = vitals;
                
                await connection.query(`
                    INSERT INTO patient_vitals 
                        (appointment_id, patient_id, weight_kg, height_cm, systolic_bp, diastolic_bp, blood_sugar_mgdl, pulse_rate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        weight_kg = VALUES(weight_kg),
                        height_cm = VALUES(height_cm),
                        systolic_bp = VALUES(systolic_bp),
                        diastolic_bp = VALUES(diastolic_bp),
                        blood_sugar_mgdl = VALUES(blood_sugar_mgdl),
                        pulse_rate = VALUES(pulse_rate)
                `, [
                    appointmentId, 
                    patientId, 
                    weight_kg || null, 
                    height_cm || null, 
                    systolic_bp || null, 
                    diastolic_bp || null, 
                    blood_sugar_mgdl || null, 
                    pulse_rate || null
                ]);
            }

            await connection.commit();

            const [doctorRow] = await connection.query('SELECT name FROM users WHERE id = ?', [doctorId]);
            const doctorName = doctorRow.length > 0 ? doctorRow[0].name : 'A doctor';

            return { prescriptionId, doctorName };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getPatientAnalytics(genders, departments, min_age, max_age) {
        let conditions = ['1=1'];
        let params = [];

        if (genders) {
            conditions.push('p.gender IN (?)');
            params.push(genders.split(','));
        }
        if (departments) {
            conditions.push('s.name IN (?)');
            params.push(departments.split(','));
        }
        if (min_age) {
            conditions.push('TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) >= ?');
            params.push(parseInt(min_age));
        }
        if (max_age) {
            conditions.push('TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) <= ?');
            params.push(parseInt(max_age));
        }

        const whereClause = conditions.join(' AND ');

        const totalQuery = `
            SELECT COUNT(DISTINCT p.id) as count
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
        `;
        const [totalRows] = await db.query(totalQuery, params);
        const totalPatients = totalRows[0]?.count || 0;

        const repeatQuery = `
            SELECT COUNT(DISTINCT p.id) as count
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN services s ON d.service_id = s.id
            WHERE ${whereClause} AND p.id IN (
                SELECT patient_id FROM appointments GROUP BY patient_id HAVING COUNT(id) > 1
            )
        `;
        const [repeatRows] = await db.query(repeatQuery, params);
        const repeatPatients = repeatRows[0]?.count || 0;

        const demographicsQuery = `
            SELECT p.gender, COUNT(DISTINCT p.id) as count 
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
            GROUP BY p.gender
        `;
        const [demographicsRows] = await db.query(demographicsQuery, params);

        const ageGenderQuery = `
            SELECT TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) as age, p.gender, COUNT(DISTINCT p.id) as count
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
            GROUP BY age, p.gender
        `;
        const [ageGenderRows] = await db.query(ageGenderQuery, params);

        const diseaseQuery = `
            SELECT pr.diagnosis as name, COUNT(pr.id) as value
            FROM prescriptions pr
            JOIN patients p ON pr.patient_id = p.id
            JOIN users d ON pr.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
            GROUP BY pr.diagnosis
            ORDER BY value DESC
        `;
        const [diseaseRows] = await db.query(diseaseQuery, params);

        return {
            totalPatients,
            repeatPatients,
            demographicsRows,
            ageGenderRows,
            diseaseRows
        };
    }
}

module.exports = new DoctorRepository();
