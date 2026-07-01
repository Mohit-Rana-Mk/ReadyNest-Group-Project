const db = require('../config/db');

exports.getQueue = async (req, res) => {
    const { clinicId } = req.params;
    try {
        const [queue] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, 
                    DATE_FORMAT(a.appointment_date, '%h:%i %p') as time,
                    p.name as patientName, p.mrn as patientMrn, du.name as doctorName
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN users du ON a.doctor_id = du.id
             WHERE a.clinic_id = ? AND DATE(a.appointment_date) = CURDATE()
             ORDER BY a.appointment_date ASC`,
             [clinicId]
        );

        const [doctors] = await db.query(
            `SELECT u.id, u.name 
             FROM users u
             JOIN doctor_schedules ds ON u.id = ds.doctor_id
             WHERE ds.clinic_id = ? AND u.status = 'Active'
             GROUP BY u.id`,
             [clinicId]
        );

        const activeDoctors = doctors.length;
        
        // Calculate dynamic wait time
        const checkedInCount = queue.filter(app => app.status === 'Checked-In').length;
        let avgWaitTime = "0 mins";
        
        if (checkedInCount > 0) {
            if (activeDoctors > 0) {
                // Assuming ~15 mins per patient, distributed across available doctors
                const waitTime = Math.ceil((checkedInCount / activeDoctors) * 15);
                avgWaitTime = `${waitTime} mins`;
            } else {
                avgWaitTime = "60+ mins"; // No doctors available
            }
        } else {
            avgWaitTime = "5 mins"; // Baseline for a fresh walk-in
        }

        res.status(200).json({ queue, doctors, activeDoctors, avgWaitTime });
    } catch (error) {
        console.error('getQueue Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.checkIn = async (req, res) => {
    const { clinicId, appointmentId } = req.params;
    try {
        await db.execute(
            `UPDATE appointments SET status = 'Checked-In' WHERE id = ? AND clinic_id = ?`,
            [appointmentId, clinicId]
        );
        res.status(200).json({ message: 'Patient Checked-In Successfully' });
    } catch (error) {
        console.error('checkIn Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateStatus = async (req, res) => {
    const { clinicId, appointmentId } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ message: 'Status is required' });

    try {
        await db.execute(
            `UPDATE appointments SET status = ? WHERE id = ? AND clinic_id = ?`,
            [status, appointmentId, clinicId]
        );
        res.status(200).json({ message: 'Status Updated Successfully' });
    } catch (error) {
        console.error('updateStatus Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.lookupPatient = async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    try {
        // Find User account
        const [users] = await db.query(`SELECT id, name FROM users WHERE phone = ?`, [phone]);
        if (users.length === 0) {
            return res.status(200).json({ exists: false });
        }

        const userId = users[0].id;

        // Fetch all family members (patients)
        const [patients] = await db.query(`SELECT id, name, date_of_birth, mrn FROM patients WHERE user_id = ?`, [userId]);

        res.status(200).json({ 
            exists: true, 
            user: users[0],
            patients 
        });
    } catch (error) {
        console.error('lookupPatient Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.registerWalkIn = async (req, res) => {
    const { clinicId } = req.params;
    const { phone, doctor_id, patient_id, new_patient_name, dob } = req.body;
    
    if (!doctor_id) {
        return res.status(400).json({ message: 'doctor_id is required' });
    }

    try {
        let finalPatientId = patient_id;

        // Case 1: Brand new family member (either new account or existing account)
        if (!finalPatientId) {
            if (!new_patient_name) {
                return res.status(400).json({ message: 'Name is required for new patient' });
            }

            let userId;
            
            // Check if phone exists
            if (phone) {
                const [existingUsers] = await db.query(`SELECT id FROM users WHERE phone = ?`, [phone]);
                if (existingUsers.length > 0) {
                    userId = existingUsers[0].id;
                }
            }

            // Create User if doesn't exist
            if (!userId) {
                const email = `walkin_${Date.now()}@temp.com`;
                const finalPhone = phone || `walkin_${Date.now()}`;
                const [userResult] = await db.execute(
                    `INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, 'walkin123', 'Patient', 'Active')`,
                    [new_patient_name, email, finalPhone]
                );
                userId = userResult.insertId;
            }

            // Generate MRN
            const [maxIdResult] = await db.query(`SELECT MAX(id) as maxId FROM patients`);
            const nextId = (maxIdResult[0].maxId || 0) + 1;
            const mrn = `PT-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

            // Create Patient Profile
            const [patientResult] = await db.execute(
                `INSERT INTO patients (user_id, name, date_of_birth, gender, mrn) VALUES (?, ?, ?, 'Other', ?)`,
                [userId, new_patient_name, dob || null, mrn]
            );
            finalPatientId = patientResult.insertId;
        }

        // Book Appointment
        await db.execute(
            `INSERT INTO appointments (clinic_id, patient_id, doctor_id, appointment_date, status, booking_source, pre_remarks) 
             VALUES (?, ?, ?, NOW(), 'Checked-In', 'Walk-in', 'Walk-In Registration')`,
            [clinicId, finalPatientId, doctor_id]
        );

        res.status(201).json({ message: 'Walk-In Registered Successfully' });
    } catch (error) {
        console.error('registerWalkIn Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
