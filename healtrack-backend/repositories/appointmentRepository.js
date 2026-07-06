const db = require('../config/db');

class AppointmentRepository {
    async getAppointmentsByPatientId(patientId) {
        const [appointments] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, a.pre_remarks, a.post_remarks,
                    a.consultation_type, a.meeting_link,
                    c.name AS clinic_name, du.name AS doctor_name,
                    v.weight_kg, v.height_cm, v.systolic_bp, v.diastolic_bp, v.blood_sugar_mgdl, v.pulse_rate,
                    pr.report_url, pr.file_name,
                    (
                        SELECT JSON_ARRAYAGG(JSON_OBJECT(
                            'medicine_name', pi.medicine_name,
                            'dosage', pi.dosage,
                            'frequency', pi.frequency,
                            'duration', pi.duration,
                            'instructions', pi.instructions
                        ))
                        FROM prescriptions pres
                        JOIN prescription_items pi ON pres.id = pi.prescription_id
                        WHERE pres.appointment_id = a.id
                    ) AS prescriptions
             FROM appointments a
             JOIN clinics c ON a.clinic_id = c.id
             JOIN users du ON a.doctor_id = du.id
             LEFT JOIN patient_vitals v ON a.id = v.appointment_id
             LEFT JOIN patient_reports pr ON a.id = pr.appointment_id
             WHERE a.patient_id = ?
             ORDER BY a.appointment_date DESC
             LIMIT 20`,
            [patientId]
        );
        return appointments;
    }

    async getFamilyAppointmentsByUserId(userId) {
        const [appointments] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, a.pre_remarks, a.post_remarks,
                    a.consultation_type, a.meeting_link,
                    c.name AS clinic_name, du.name AS doctor_name,
                    p.id AS patient_id, p.name AS patient_name,
                    v.weight_kg, v.height_cm, v.systolic_bp, v.diastolic_bp, v.blood_sugar_mgdl, v.pulse_rate,
                    pr.report_url, pr.file_name,
                    (
                        SELECT JSON_ARRAYAGG(JSON_OBJECT(
                            'medicine_name', pi.medicine_name,
                            'dosage', pi.dosage,
                            'frequency', pi.frequency,
                            'duration', pi.duration,
                            'instructions', pi.instructions
                        ))
                        FROM prescriptions pres
                        JOIN prescription_items pi ON pres.id = pi.prescription_id
                        WHERE pres.appointment_id = a.id
                    ) AS prescriptions
             FROM appointments a
             JOIN clinics c ON a.clinic_id = c.id
             JOIN users du ON a.doctor_id = du.id
             JOIN patients p ON a.patient_id = p.id
             LEFT JOIN patient_vitals v ON a.id = v.appointment_id
             LEFT JOIN patient_reports pr ON a.id = pr.appointment_id
             WHERE p.user_id = ?
             ORDER BY a.appointment_date DESC
             LIMIT 50`,
            [userId]
        );
        return appointments;
    }

    async createAppointment(clinicId, doctorId, patientId, appointmentDate, cType, meetingLink) {
        await db.execute(
            `INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_date, status, booking_source, consultation_type, meeting_link)
             VALUES (?, ?, ?, ?, 'Scheduled', 'App', ?, ?)`,
            [clinicId, doctorId, patientId, appointmentDate, cType, meetingLink]
        );
    }

    async cancelAppointment(appointmentId) {
        await db.execute(
            `UPDATE appointments SET status = 'Canceled' WHERE id = ?`,
            [appointmentId]
        );
    }

    async rescheduleAppointment(appointmentId, newDate) {
        await db.execute(
            `UPDATE appointments SET appointment_date = ?, status = 'Scheduled' WHERE id = ?`,
            [newDate, appointmentId]
        );
    }
}

module.exports = new AppointmentRepository();
