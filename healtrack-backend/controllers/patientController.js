const db = require('../config/db');

// In-memory cache for tracking the last queried/predicted disease per patient ID
const patientLastDiseaseCache = {};

// ─────────────────────────────────────────────────────────────
// A. Preventive Recommendations
// ─────────────────────────────────────────────────────────────
exports.getRecommendations = async (req, res) => {
    try {
        const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patientRows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        const actualPatientId = patientRows[0].id;

        const [recommendations] = await db.query(
            `SELECT pr.id, pr.alert_title, pr.alert_description, pr.status, pr.generated_by,
                    s.name AS target_service, pr.created_at
             FROM preventive_recommendations pr
             JOIN services s ON pr.target_service_id = s.id
             WHERE pr.patient_id = ? AND pr.status = 'Pending'
             ORDER BY pr.created_at DESC`,
            [actualPatientId]
        );

        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Recommendations Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.dismissRecommendation = async (req, res) => {
    try {
        const { id } = req.params;
        const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patientRows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        const actualPatientId = patientRows[0].id;

        await db.query(
            `UPDATE preventive_recommendations SET status = 'Read' WHERE id = ? AND patient_id = ?`,
            [id, actualPatientId]
        );
        res.status(200).json({ success: true, message: 'Recommendation dismissed' });
    } catch (error) {
        console.error('Dismiss Recommendations Error:', error);
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
    const { user_input } = req.body;

    if (!user_input) {
        return res.status(400).json({ message: 'user_input is required' });
    }

    try {
        const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patientRows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        const actualPatientId = patientRows[0].id;

        const inputLower = user_input.toLowerCase().trim().replace(/[?.!]/g, '');
        
        // Check for follow-up conversational queries
        const isFollowUpCause = inputLower.includes('cause') || 
                                inputLower.includes('why does it happen') || 
                                inputLower.includes('how did i get') || 
                                inputLower.includes('how is it caused');
                                
        const isFollowUpPrecaution = inputLower.includes('precaution') || 
                                     inputLower.includes('prevent') || 
                                     inputLower.includes('treatment') || 
                                     inputLower.includes('remedy') || 
                                     inputLower.includes('cure');

        const isGenericFollowUp = inputLower === 'this' || 
                                  inputLower.includes('about this') || 
                                  inputLower.includes('tell me more');

        if ((isFollowUpCause || isFollowUpPrecaution || isGenericFollowUp) && patientLastDiseaseCache[actualPatientId]) {
            const cachedDisease = patientLastDiseaseCache[actualPatientId];
            try {
                const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
                const infoResponse = await fetch(`${mlServiceUrl}/api/v1/disease-info/${encodeURIComponent(cachedDisease)}`);
                if (infoResponse.ok) {
                    const infoData = await infoResponse.json();
                    if (infoData.success) {
                        const predictedRisk = infoData.risk_tier;
                        const predictedDisease = infoData.disease;
                        const predictionsList = [{
                            rank: 1,
                            disease: infoData.disease,
                            confidence: 100,
                            risk_tier: infoData.risk_tier,
                            description: infoData.description,
                            precautions: infoData.precautions
                        }];

                        let recommendation = '';
                        if (isFollowUpCause) {
                            recommendation = `Here is what causes ${infoData.disease}: ${infoData.description}`;
                        } else if (isFollowUpPrecaution) {
                            recommendation = `To manage/prevent ${infoData.disease}, you should follow these precautions: ${infoData.precautions.join(', ')}.`;
                        } else {
                            recommendation = `Here is more information about ${infoData.disease}: ${infoData.description}`;
                        }

                        // Save log to DB
                        let dbRisk = predictedRisk;
                        if (dbRisk === 'Urgent') dbRisk = 'High';
                        else if (dbRisk === 'Moderate') dbRisk = 'Medium';

                        await db.execute(
                            `INSERT INTO ai_triage_logs (patient_id, user_input, extracted_symptoms, predicted_risk)
                             VALUES (?, ?, ?, ?)`,
                            [actualPatientId, user_input, JSON.stringify([]), dbRisk]
                        );

                        return res.status(200).json({
                            predicted_risk: predictedRisk,
                            extracted_symptoms: [],
                            predicted_disease: predictedDisease,
                            recommendation: recommendation,
                            predictions: predictionsList
                        });
                    }
                }
            } catch (err) {
                console.error('Error calling ML service for cached disease info:', err.message);
            }
        }

        // List of all known diseases supported by the ML engine
        const knownDiseases = [
            'vertigo', 'aids', 'acne', 'alcoholic hepatitis', 'allergy', 'arthritis', 'asthma', 
            'spondylosis', 'chicken pox', 'cholestasis', 'cold', 'dengue', 'diabetes', 
            'piles', 'drug reaction', 'fungal infection', 'gerd', 'gastroenteritis', 
            'heart attack', 'hypertension', 'hyperthyroidism', 'hypoglycemia', 
            'hypothyroidism', 'impetigo', 'jaundice', 'malaria', 'migraine', 
            'osteoarthritis', 'paralysis', 'ulcer', 'pneumonia', 'psoriasis', 
            'tuberculosis', 'typhoid', 'urinary tract infection', 'varicose veins', 'hepatitis a'
        ];

        let directDiseaseMatch = null;
        for (const kd of knownDiseases) {
            if (inputLower === kd || 
                inputLower === `i have ${kd}` || 
                inputLower === `tell me about ${kd}` || 
                inputLower === `what is ${kd}` ||
                inputLower === `how to treat ${kd}`) {
                directDiseaseMatch = kd;
                break;
            }
        }

        if (directDiseaseMatch) {
            try {
                const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
                const infoResponse = await fetch(`${mlServiceUrl}/api/v1/disease-info/${encodeURIComponent(directDiseaseMatch)}`);
                if (infoResponse.ok) {
                    const infoData = await infoResponse.json();
                    if (infoData.success) {
                        const predictedRisk = infoData.risk_tier;
                        const predictedDisease = infoData.disease;
                        const predictionsList = [{
                            rank: 1,
                            disease: infoData.disease,
                            confidence: 100,
                            risk_tier: infoData.risk_tier,
                            description: infoData.description,
                            precautions: infoData.precautions
                        }];

                        // Cache the disease name for context memory
                        patientLastDiseaseCache[actualPatientId] = infoData.disease;

                        let recommendation = 'Monitor your symptoms. If they persist for more than 48 hours, consider a visit.';
                        if (predictedRisk === 'Urgent') {
                            recommendation = 'Please visit a hospital immediately or call emergency services.';
                        } else if (predictedRisk === 'High') {
                            recommendation = 'We highly recommend booking an urgent consultation today.';
                        } else if (predictedRisk === 'Moderate' || predictedRisk === 'Medium') {
                            recommendation = 'We recommend booking a consultation within 24 to 48 hours.';
                        }

                        // Save log to DB
                        let dbRisk = predictedRisk;
                        if (dbRisk === 'Urgent') dbRisk = 'High';
                        else if (dbRisk === 'Moderate') dbRisk = 'Medium';

                        await db.execute(
                            `INSERT INTO ai_triage_logs (patient_id, user_input, extracted_symptoms, predicted_risk)
                             VALUES (?, ?, ?, ?)`,
                            [actualPatientId, user_input, JSON.stringify([]), dbRisk]
                        );

                        return res.status(200).json({
                            predicted_risk: predictedRisk,
                            extracted_symptoms: [],
                            predicted_disease: predictedDisease,
                            recommendation: recommendation,
                            predictions: predictionsList
                        });
                    }
                }
            } catch (err) {
                console.error('Error calling ML service for direct disease info:', err.message);
            }
        }


        // 1. Fetch valid symptoms list from ML Service
        let validSymptoms = [];
        try {
            const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
            const symResponse = await fetch(`${mlServiceUrl}/api/v1/symptoms`);
            if (symResponse.ok) {
                validSymptoms = await symResponse.json();
            }
        } catch (err) {
            console.error('Error calling ML service for symptoms:', err.message);
        }

        // Fallback list of common symptoms if ML service is down
        if (!validSymptoms || validSymptoms.length === 0) {
            validSymptoms = [
                'itching', 'skin_rash', 'continuous_sneezing', 'shivering', 'chills', 'joint_pain',
                'stomach_pain', 'acidity', 'ulcers_on_tongue', 'muscle_wasting', 'vomiting',
                'burning_micturition', 'spotting_urination', 'fatigue', 'weight_gain', 'anxiety',
                'cold_hands_and_feets', 'mood_swings', 'weight_loss', 'restlessness', 'lethargy',
                'patches_in_throat', 'irregular_sugar_level', 'cough', 'high_fever', 'sunken_eyes',
                'breathlessness', 'sweating', 'dehydration', 'indigestion', 'headache', 'yellowish_skin',
                'dark_urine', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain',
                'constipation', 'abdominal_pain', 'diarrhoea', 'mild_fever', 'yellow_urine',
                'yellowing_of_eyes', 'acute_liver_failure', 'fluid_overload', 'swelling_of_stomach',
                'swelled_lymph_nodes', 'malaise', 'blurred_and_distorted_vision', 'phlegm',
                'throat_irritation', 'redness_of_eyes', 'sinus_pressure', 'runny_nose', 'congestion',
                'chest_pain', 'weakness_in_limbs', 'fast_heart_rate', 'pain_during_bowel_movements',
                'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus', 'neck_pain', 'dizziness',
                'cramps', 'bruising', 'obesity', 'swollen_legs', 'swollen_blood_vessels',
                'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails', 'swollen_extremeties',
                'excessive_hunger', 'extra_marital_contacts', 'drying_of_peels_and_cutis',
                'internal_itching', 'toxic_look_(typhos)', 'depression', 'irritability', 'muscle_pain',
                'altered_sensorium', 'red_spots_over_body', 'belly_pain', 'abnormal_menstruation',
                'dischromic_patches', 'watering_from_eyes', 'increased_appetite', 'polyuria',
                'family_history', 'mucoid_sputum', 'rusty_sputum', 'lack_of_concentration',
                'visual_disturbances', 'receiving_blood_transfusion', 'receiving_unsterile_injection',
                'coma', 'stomach_bleeding', 'distention_of_abdomen', 'history_of_alcohol_consumption',
                'blood_in_sputum', 'prominent_veins_on_calf', 'palpitations', 'painful_walking',
                'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling', 'silver_like_dusting',
                'small_dents_in_nails', 'inflammatory_nails', 'blister', 'red_sore_around_nose',
                'yellow_crust_ooze'
            ];
        }


        const urgentKeywords = ['stroke', 'heart attack', 'cardiac', 'hemorrhage', 'unconscious', 'coma', 'poisoning', 'paralysis', 'difficulty breathing'];
        const highRiskKeywords = ['cancer', 'tumor', 'bleeding', 'tuberculosis', 'aids', 'hiv', 'severe chest pain', 'chest pain'];

        const hasUrgentKeyword = urgentKeywords.some(kw => inputLower.includes(kw));
        const hasHighRiskKeyword = highRiskKeywords.some(kw => inputLower.includes(kw));

        const matchedSymptoms = [];

        // Scan and match symptoms from free text
        validSymptoms.forEach(sym => {
            // Replace underscores with spaces for natural language matching
            const readableSym = sym.replace(/_/g, ' ');
            if (inputLower.includes(readableSym)) {
                matchedSymptoms.push(sym);
            }
        });

        // Fallback to basic keywords if no matching symptom
        if (matchedSymptoms.length === 0) {
            if (!hasUrgentKeyword && !hasHighRiskKeyword) {
                if (inputLower.includes('fever') || inputLower.includes('hot')) matchedSymptoms.push('high_fever');
                if (inputLower.includes('headache') || inputLower.includes('head pain')) matchedSymptoms.push('headache');
                if (inputLower.includes('cough')) matchedSymptoms.push('cough');
                if (inputLower.includes('vomit')) matchedSymptoms.push('vomiting');
                if (inputLower.includes('tired') || inputLower.includes('weak')) matchedSymptoms.push('fatigue');
                if (inputLower.includes('dizzy')) matchedSymptoms.push('dizziness');
                if (inputLower.includes('nausea') || inputLower.includes('sick')) matchedSymptoms.push('nausea');
                if (inputLower.includes('chest pain')) matchedSymptoms.push('chest_pain');
                if (inputLower.includes('breath') || inputLower.includes('short of breath')) matchedSymptoms.push('breathlessness');
            }
        }

        let predictedRisk = 'Low';
        let predictedDisease = 'Unknown / Needs Clinical Evaluation';
        let recommendation = 'Monitor your symptoms. If they persist for more than 48 hours, consider a visit.';
        let predictionsList = [];

        if (matchedSymptoms.length > 0) {
            // 2. Call ML Service disease prediction endpoint
            try {
                const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
                const mlResponse = await fetch(`${mlServiceUrl}/api/v1/predict/disease`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symptoms: matchedSymptoms })
                });

                if (mlResponse.ok) {
                    const mlData = await mlResponse.json();
                    if (mlData.success && mlData.predictions && mlData.predictions.length > 0) {
                        predictionsList = mlData.predictions;
                        const topPrediction = mlData.predictions[0];
                        predictedDisease = `${topPrediction.disease} (${topPrediction.confidence}% confidence)`;
                        predictedRisk = topPrediction.risk_tier;
                    }
                }
            } catch (err) {
                console.error('Error calling ML service for prediction:', err.message);
                // Fallback to simple matching if ML service fails
                if (inputLower.includes('chest pain') || inputLower.includes('shortness of breath')) {
                    predictedRisk = 'High';
                    predictedDisease = 'Possible Cardiac Event (Fallback)';
                } else if (inputLower.includes('fever') && inputLower.includes('cough')) {
                    predictedRisk = 'Medium';
                    predictedDisease = 'Viral Influenza (Fallback)';
                }
            }
        } else {
            // No symptoms matched, but check if we have urgent/high-risk keywords
            if (hasUrgentKeyword) {
                predictedRisk = 'Urgent';
                predictedDisease = 'Suspicion of Urgent Condition (Clinical Evaluation Required)';
            } else if (hasHighRiskKeyword) {
                predictedRisk = 'High';
                predictedDisease = 'Suspicion of High-Risk Condition (Clinical Evaluation Required)';
            }
        }

        // Apply keyword-based upgrades if necessary
        if (hasUrgentKeyword) {
            predictedRisk = 'Urgent';
        } else if (hasHighRiskKeyword && predictedRisk !== 'Urgent') {
            predictedRisk = 'High';
        }

        // Set recommendations based on finalized risk level
        if (predictedRisk === 'Urgent') {
            recommendation = 'Please visit a hospital immediately or call emergency services.';
        } else if (predictedRisk === 'High') {
            recommendation = 'We highly recommend booking an urgent consultation today.';
        } else if (predictedRisk === 'Moderate' || predictedRisk === 'Medium') {
            recommendation = 'We recommend booking a consultation within 24 to 48 hours.';
        }

        // 3. Persist to database
        const symptomsJson = JSON.stringify(matchedSymptoms.map(s => s.replace(/_/g, ' ')));
        let dbRisk = predictedRisk;
        if (dbRisk === 'Urgent') dbRisk = 'High';
        else if (dbRisk === 'Moderate') dbRisk = 'Medium';

        await db.execute(
            `INSERT INTO ai_triage_logs (patient_id, user_input, extracted_symptoms, predicted_risk)
             VALUES (?, ?, ?, ?)`,
            [actualPatientId, user_input, symptomsJson, dbRisk]
        );

        // Cache the disease name for context memory if we have a top prediction
        if (predictionsList && predictionsList.length > 0) {
            patientLastDiseaseCache[actualPatientId] = predictionsList[0].disease;
        }

        // 4. Return AI response to client
        res.status(201).json({
            predicted_risk: predictedRisk,
            extracted_symptoms: matchedSymptoms.map(s => s.replace(/_/g, ' ')),
            predicted_disease: predictedDisease,
            recommendation: recommendation,
            predictions: predictionsList
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
        // Use IST date to match the local timezone of the clinics
        const today = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(today.getTime() + istOffset);
        const dateString = istDate.toISOString().split('T')[0];

        // Count pending appointments for today
        const [rows] = await db.query(
            `SELECT COUNT(*) as pending_count 
             FROM appointments 
             WHERE clinic_id = ? 
               AND DATE(appointment_date) = ? 
               AND status IN ('Scheduled', 'Checked-In', 'In Consultation')`,
            [clinicId, dateString]
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
            `SELECT DISTINCT u.id, u.name, COALESCE(cs.consultation_fee, 0) as consultation_fee, s.name as department, s.id as department_id
             FROM users u
             JOIN doctor_schedules ds ON u.id = ds.doctor_id
             LEFT JOIN services s ON u.service_id = s.id
             LEFT JOIN clinic_services cs ON cs.clinic_id = ds.clinic_id AND cs.service_id = u.service_id
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
    
    console.log("BOOK APPT PAYLOAD:", req.body);
    if (!clinic_id || !doctor_id || !patient_id || !appointment_date) {
        const missing = [];
        if (!clinic_id) missing.push('clinic_id');
        if (!doctor_id) missing.push('doctor_id');
        if (!patient_id) missing.push('patient_id');
        if (!appointment_date) missing.push('appointment_date');
        return res.status(400).json({ message: `Missing required booking fields: ${missing.join(', ')}` });
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
