const db = require('../config/db');

// ─────────────────────────────────────────────────────────────
// A. Preventive Recommendations
// ─────────────────────────────────────────────────────────────
exports.getRecommendations = async (req, res) => {
    const { patientId } = req.params;

    try {
        const [recommendations] = await db.query(
            `SELECT pr.id, pr.alert_title, pr.alert_description, pr.status, pr.generated_by,
                    s.name AS target_service, pr.created_at
             FROM preventive_recommendations pr
             JOIN services s ON pr.target_service_id = s.id
             WHERE pr.patient_id = ? AND pr.status = 'Pending'
             ORDER BY pr.created_at DESC`,
            [patientId]
        );

        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Recommendations Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getServices = async (req, res) => {
    try {
        const [services] = await db.query(`SELECT id, name FROM services ORDER BY name ASC`);
        res.status(200).json(services);
    } catch (error) {
        console.error('Fetch Services Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────
// B. Nearby Clinic Discovery
// ─────────────────────────────────────────────────────────────
exports.getClinicCities = async (req, res) => {
    try {
        const [cities] = await db.query(`SELECT DISTINCT city FROM clinics WHERE verification_status = 'Approved' AND city IS NOT NULL ORDER BY city ASC`);
        res.status(200).json(cities);
    } catch (error) {
        console.error('Fetch Cities Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getNearbyClinics = async (req, res) => {
    const { city, min_rating, service_id, lat, lng, radius } = req.query;
    try {
        let selectClause = `
            SELECT c.id, c.name, c.address, c.city, c.license_number,
                   c.opening_time, c.closing_time, c.latitude, c.longitude,
                   COALESCE(AVG(cr.rating), 0) AS average_rating,
                   COUNT(cr.id) AS total_reviews
        `;
        
        // If lat/lng provided, calculate distance in km using Haversine formula
        if (lat && lng) {
            selectClause += `, (6371 * acos(cos(radians(?)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(?)) + sin(radians(?)) * sin(radians(c.latitude)))) AS distance`;
        }

        let query = `${selectClause}
            FROM clinics c
            LEFT JOIN clinic_reviews cr ON c.id = cr.clinic_id
        `;
        
        if (service_id) {
             query += ` JOIN clinic_services cs ON c.id = cs.clinic_id `;
        }
        
        const params = [];
        if (lat && lng) {
            params.push(lat, lng, lat);
        }
        
        const conditions = ["c.verification_status = 'Approved'"];
        
        if (city) {
            conditions.push("c.city = ?");
            params.push(city);
        }
        if (service_id) {
            conditions.push("cs.service_id = ?");
            params.push(service_id);
        }
        
        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }
        
        query += " GROUP BY c.id ";
        
        const havingConditions = [];
        if (min_rating) {
            havingConditions.push("average_rating >= ?");
            params.push(parseFloat(min_rating));
        }
        if (lat && lng && radius) {
            havingConditions.push("distance <= ?");
            params.push(parseFloat(radius));
        }
        
        if (havingConditions.length > 0) {
            query += " HAVING " + havingConditions.join(" AND ");
        }
        
        if (lat && lng) {
            query += " ORDER BY distance ASC ";
        }
        
        query += " LIMIT 20";

        const [clinics] = await db.query(query, params);

        res.status(200).json(clinics);
    } catch (error) {
        console.error('Fetch Nearby Clinics Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────
// C. AI Symptom Triage
// ─────────────────────────────────────────────────────────────
exports.submitTriage = async (req, res) => {
    const { patient_id, user_input } = req.body;

    if (!patient_id || !user_input) {
        return res.status(400).json({ message: 'patient_id and user_input are required' });
    }

    try {
        // ── Mock AI Engine ──────────────────────────────────
        // In production this would call an ML microservice.
        const inputLower = user_input.toLowerCase();
        const symptomMap = {
            'headache': 'Headache', 'fever': 'Fever', 'cough': 'Cough',
            'chest pain': 'Chest Pain', 'nausea': 'Nausea', 'fatigue': 'Fatigue',
            'dizziness': 'Dizziness', 'sore throat': 'Sore Throat',
            'shortness of breath': 'Shortness of Breath', 'body ache': 'Body Ache',
            'cold': 'Cold', 'vomiting': 'Vomiting', 'back pain': 'Back Pain'
        };

        const extractedSymptoms = Object.keys(symptomMap)
            .filter(key => inputLower.includes(key))
            .map(key => symptomMap[key]);

        // Fallback: if no known symptom matched, echo the raw input
        if (extractedSymptoms.length === 0) {
            extractedSymptoms.push(user_input.trim());
        }

        // Risk scoring: High-risk keywords escalate the prediction
        let predictedRisk = 'Low';
        const highRisk = ['chest pain', 'shortness of breath'];
        const mediumRisk = ['fever', 'dizziness', 'nausea', 'vomiting'];

        if (highRisk.some(s => inputLower.includes(s))) {
            predictedRisk = 'High';
        } else if (mediumRisk.some(s => inputLower.includes(s)) || extractedSymptoms.length >= 2) {
            predictedRisk = 'Medium';
        }

        // ── Mock Disease Prediction ─────────────────────────
        let predictedDisease = 'Unknown / Needs Clinical Evaluation';
        if (inputLower.includes('chest pain') || inputLower.includes('shortness of breath')) {
            predictedDisease = 'Possible Cardiac Event or Severe Respiratory Infection';
        } else if (inputLower.includes('fever') && inputLower.includes('cough')) {
            predictedDisease = 'Viral Influenza or Upper Respiratory Infection';
        } else if (inputLower.includes('fever') && inputLower.includes('body ache')) {
            predictedDisease = 'Dengue or Viral Fever';
        } else if (inputLower.includes('headache') && inputLower.includes('nausea')) {
            predictedDisease = 'Migraine or Gastrointestinal Infection';
        }

        // ── Persist to database ─────────────────────────────
        const symptomsJson = JSON.stringify(extractedSymptoms);

        await db.execute(
            `INSERT INTO ai_triage_logs (patient_id, user_input, extracted_symptoms, predicted_risk)
             VALUES (?, ?, ?, ?)`,
            [patient_id, user_input, symptomsJson, predictedRisk]
        );

        // ── Return AI response to client ────────────────────
        res.status(201).json({
            predicted_risk: predictedRisk,
            extracted_symptoms: extractedSymptoms,
            predicted_disease: predictedDisease,
            recommendation: predictedRisk === 'High'
                ? 'Please visit a hospital immediately or call emergency services.'
                : predictedRisk === 'Medium'
                    ? 'We recommend booking a consultation within 24 hours.'
                    : 'Monitor your symptoms. If they persist for more than 48 hours, consider a visit.'
        });
    } catch (error) {
        console.error('Submit Triage Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────
// D. Patient Appointment History
// ─────────────────────────────────────────────────────────────
exports.getAppointments = async (req, res) => {
    const { patientId } = req.params;

    try {
        const [appointments] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, a.pre_remarks, a.post_remarks,
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

        res.status(200).json(appointments);
    } catch (error) {
        console.error('Fetch Appointments Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getFamilyAppointments = async (req, res) => {
    const userId = req.user?.id || req.query.user_id || 1;
    try {
        const [appointments] = await db.query(
            `SELECT a.id, a.appointment_date, a.status, a.pre_remarks, a.post_remarks,
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

        res.status(200).json(appointments);
    } catch (error) {
        console.error('Fetch Family Appointments Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────
// E. Family Members (Dependents)
// ─────────────────────────────────────────────────────────────
exports.getFamilyMembers = async (req, res) => {
    // We expect the logged in user id, but we'll accept it via query for flexibility
    const userId = req.user?.id || req.query.user_id || 1;
    
    try {
        const [patients] = await db.query(
            `SELECT id, name, date_of_birth, gender, mrn 
             FROM patients 
             WHERE user_id = ?
             ORDER BY id ASC`,
            [userId]
        );
        res.status(200).json(patients);
    } catch (error) {
        console.error('Fetch Family Members Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.addFamilyMember = async (req, res) => {
    const userId = req.user?.id || req.query.user_id || 1;
    const { name, date_of_birth, gender, blood_group } = req.body;
    
    if (!name || !gender) {
        return res.status(400).json({ message: 'Name and gender are required' });
    }
    
    // Generate mock MRN
    const mrn = 'MRN-' + Math.floor(100000 + Math.random() * 900000);
    
    try {
        const [result] = await db.execute(
            `INSERT INTO patients (user_id, mrn, name, date_of_birth, gender, blood_group)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, mrn, name, date_of_birth || null, gender, blood_group || null]
        );
        res.status(201).json({ message: 'Family member added successfully', patient_id: result.insertId });
    } catch (error) {
        console.error('Add Family Member Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────
// Wait Time Analysis
// ─────────────────────────────────────────────────────────────
exports.getClinicWaitTime = async (req, res) => {
    const { clinicId } = req.params;
    try {
        // Count pending appointments for today
        const [rows] = await db.query(
            `SELECT COUNT(*) as pending_count 
             FROM appointments 
             WHERE clinic_id = ? 
               AND DATE(appointment_date) = CURDATE() 
               AND status IN ('Scheduled', 'Checked-In', 'In Consultation')`,
            [clinicId]
        );
        
        const pendingCount = rows[0].pending_count;
        const avgWaitPerPatient = 15; // minutes
        const totalWaitMinutes = pendingCount * avgWaitPerPatient;
        
        const suggestedTime = new Date(Date.now() + totalWaitMinutes * 60000);
        
        res.status(200).json({
            pending_patients: pendingCount,
            estimated_wait_minutes: totalWaitMinutes,
            suggested_time: suggestedTime
        });
    } catch (error) {
        console.error('Wait Time Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getClinicDoctors = async (req, res) => {
    const { clinicId } = req.params;
    try {
        const [doctors] = await db.query(
            `SELECT DISTINCT u.id, u.name, s.name as department, s.id as department_id
             FROM users u
             JOIN doctor_schedules ds ON u.id = ds.doctor_id
             LEFT JOIN services s ON u.service_id = s.id
             WHERE ds.clinic_id = ? AND u.role = 'Doctor' AND u.status = 'Active'`,
            [clinicId]
        );
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Fetch Clinic Doctors Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────
// F. Appointment Management (Book, Cancel, Reschedule)
// ─────────────────────────────────────────────────────────────
exports.bookAppointment = async (req, res) => {
    const { clinic_id, doctor_id, patient_id, appointment_date } = req.body;
    
    if (!clinic_id || !doctor_id || !patient_id || !appointment_date) {
        return res.status(400).json({ message: 'Missing required booking fields' });
    }

    try {
        await db.execute(
            `INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_date, status, booking_source)
             VALUES (?, ?, ?, ?, 'Scheduled', 'App')`,
            [clinic_id, doctor_id, patient_id, appointment_date]
        );
        if (req.io) req.io.emit('QUEUE_UPDATE', { clinicId: clinic_id });
        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Book Appointment Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.cancelAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        await db.execute(
            `UPDATE appointments SET status = 'Canceled' WHERE id = ?`,
            [appointmentId]
        );
        if (req.io) req.io.emit('QUEUE_UPDATE', {}); // Ideally fetch clinic_id before emitting, but broad emit works for MVP
        res.status(200).json({ message: 'Appointment canceled successfully' });
    } catch (error) {
        console.error('Cancel Appointment Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.rescheduleAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { new_date } = req.body;
    
    if (!new_date) {
        return res.status(400).json({ message: 'New date is required' });
    }

    try {
        await db.execute(
            `UPDATE appointments SET appointment_date = ?, status = 'Scheduled' WHERE id = ?`,
            [new_date, appointmentId]
        );
        if (req.io) req.io.emit('QUEUE_UPDATE', {});
        res.status(200).json({ message: 'Appointment rescheduled successfully' });
    } catch (error) {
        console.error('Reschedule Appointment Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────
// G. Clinic Reviews
// ─────────────────────────────────────────────────────────────
exports.submitClinicReview = async (req, res) => {
    const { clinic_id, patient_id, rating, review_text } = req.body;
    
    if (!clinic_id || !patient_id || !rating) {
        return res.status(400).json({ message: 'Missing required review fields' });
    }

    try {
        await db.execute(
            `INSERT INTO clinic_reviews (clinic_id, patient_id, rating, review_text)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text)`,
            [clinic_id, patient_id, rating, review_text]
        );
        res.status(201).json({ message: 'Review submitted successfully' });
    } catch (error) {
        console.error('Submit Review Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
