const db = require('../config/db');

// Fetch appointments assigned to the logged-in doctor
exports.getAppointments = async (req, res) => {
    try {
        const doctorId = req.user?.id || req.query.doctor_id || 2; // Fallback for local testing/dev
        const dateFilter = req.query.date_filter || 'today';
        
        let dateCondition = '';
        if (dateFilter === 'today') {
            dateCondition = 'AND DATE(a.appointment_date) = CURDATE()';
        } else if (dateFilter === 'past_week') {
            dateCondition = 'AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        } else if (dateFilter === 'past_month') {
            dateCondition = 'AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        }
        // if 'all', dateCondition remains empty

        const [appointments] = await db.query(`
            SELECT 
                a.id AS appointment_id,
                a.doctor_id,
                a.appointment_date,
                a.status,
                a.booking_source,
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
            WHERE a.doctor_id = ? ${dateCondition}
            ORDER BY a.appointment_date ASC
        `, [doctorId]);

        res.json({ success: true, data: appointments });
    } catch (error) {
        console.error("Error fetching doctor appointments:", error);
        res.status(500).json({ success: false, message: "Server error fetching appointments", error: error.message });
    }
};

// Fetch patient clinical records history
exports.getPatientHistory = async (req, res) => {
    try {
        const patientId = req.params.id;

        // Retrieve recorded vitals
        const [vitals] = await db.query(`
            SELECT * FROM patient_vitals 
            WHERE patient_id = ? 
            ORDER BY recorded_at DESC
        `, [patientId]);

        // Get past prescriptions
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

        // Fetch details for each prescription item
        const prescriptionIds = prescriptions.map(p => p.prescription_id);
        let prescriptionItems = [];
        
        if (prescriptionIds.length > 0) {
            const [items] = await db.query(`
                SELECT * FROM prescription_items 
                WHERE prescription_id IN (?)
            `, [prescriptionIds]);
            prescriptionItems = items;
        }

        // Attach items to prescriptions
        const prescriptionsWithItems = prescriptions.map(pr => {
            return {
                ...pr,
                items: prescriptionItems.filter(item => item.prescription_id === pr.prescription_id)
            };
        });

        res.json({
            success: true,
            data: {
                vitalsHistory: vitals,
                prescriptions: prescriptionsWithItems
            }
        });
    } catch (error) {
        console.error("Error fetching patient history:", error);
        res.status(500).json({ success: false, message: "Server error fetching patient history", error: error.message });
    }
};

// Submit consultation logs and prescriptions (transactional)
exports.completeConsultation = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const doctorId = req.user?.id || req.body.doctor_id || 2;
        const { appointmentId, patientId, diagnosis, preRemarks, postRemarks, vitals, prescriptionItems } = req.body;

        if (!appointmentId || !patientId || !diagnosis) {
            return res.status(400).json({ success: false, message: "Missing required fields: appointmentId, patientId, and diagnosis are required" });
        }

        // Update appointment status to completed and save remarks
        await connection.query(`
            UPDATE appointments 
            SET status = 'Completed', pre_remarks = ?, post_remarks = ? 
            WHERE id = ?
        `, [preRemarks || '', postRemarks || '', appointmentId]);

        // Insert Master Prescription record
        const [prescResult] = await connection.query(`
            INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, diagnosis) 
            VALUES (?, ?, ?, ?)
        `, [appointmentId, patientId, doctorId, diagnosis]);

        const prescriptionId = prescResult.insertId;

        // Insert individual medication lines
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

        // Save vitals measurements if captured
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
        
        // Fetch doctor name for notification
        const [doctorRow] = await connection.query('SELECT name FROM users WHERE id = ?', [doctorId]);
        const doctorName = doctorRow.length > 0 ? doctorRow[0].name : 'A doctor';

        // Emit Socket Event to Reception Portal
        if (req.io) {
            req.io.emit('QUEUE_UPDATE', {
                appointmentId,
                patientId,
                status: 'Completed',
                doctorName,
                message: `${doctorName} has completed a consultation`
            });
        }

        res.json({ success: true, message: "Consultation completed successfully", data: { prescriptionId } });
    } catch (error) {
        await connection.rollback();
        console.error("Transaction Error in completeConsultation:", error);
        res.status(500).json({ success: false, message: "Failed to complete consultation", error: error.message });
    } finally {
        connection.release();
    }
};

