const db = require('../config/db');
const patientService = require('../services/patientService');
const appointmentService = require('../services/appointmentService');

// In-memory cache for tracking the last queried/predicted disease per patient ID
const patientLastDiseaseCache = {};

const getMlHeaders = (extraHeaders = {}) => {
    const headers = { ...extraHeaders };
    if (process.env.ML_API_KEY) {
        headers['X-API-Key'] = process.env.ML_API_KEY;
    }
    return headers;
};

// ─────────────────────────────────────────────────────────────
// A. Preventive Recommendations
// ─────────────────────────────────────────────────────────────
exports.getRecommendations = async (req, res) => {
    try {
        const recommendations = await patientService.getRecommendations(req.user.id);
        res.status(200).json(recommendations);
    } catch (error) {
        if (error.message === 'Patient not found') {
            return res.status(404).json({ message: 'Patient not found' });
        }
        console.error('Recommendations Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.dismissRecommendation = async (req, res) => {
    try {
        const result = await patientService.dismissRecommendation(req.user.id, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Patient not found') {
            return res.status(404).json({ message: 'Patient not found' });
        }
        console.error('Dismiss Recommendations Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getServices = async (req, res) => {
    try {
        const services = await patientService.getServices();
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
        const cities = await patientService.getClinicCities();
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
        
        let validSymptoms = [];
        try {
            let mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
            mlServiceUrl = mlServiceUrl.replace(/\/+$/, '');
            const symResponse = await fetch(`${mlServiceUrl}/api/v1/symptoms`, {
                headers: getMlHeaders()
            });
            if (symResponse.ok) {
                validSymptoms = await symResponse.json();
            }
        } catch (err) {
            console.error('Error calling ML service for symptoms:', err.message);
        }

        if (!validSymptoms || validSymptoms.length === 0) {
            validSymptoms = [
                'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing',
                'shivering', 'chills', 'joint_pain', 'stomach_pain', 'acidity', 'ulcers_on_tongue',
                'muscle_wasting', 'vomiting', 'burning_micturition', 'spotting_ urination', 'fatigue',
                'weight_gain', 'anxiety', 'cold_hands_and_feets', 'mood_swings', 'weight_loss',
                'restlessness', 'lethargy', 'patches_in_throat', 'irregular_sugar_level', 'cough',
                'high_fever', 'sunken_eyes', 'breathlessness', 'sweating', 'dehydration',
                'indigestion', 'headache', 'yellowish_skin', 'dark_urine', 'nausea', 'loss_of_appetite',
                'pain_behind_the_eyes', 'back_pain', 'constipation', 'abdominal_pain', 'diarrhoea',
                'mild_fever', 'yellow_urine', 'yellowing_of_eyes', 'acute_liver_failure', 'fluid_overload',
                'swelling_of_stomach', 'swelled_lymph_nodes', 'malaise', 'blurred_and_distorted_vision',
                'phlegm', 'throat_irritation', 'redness_of_eyes', 'sinus_pressure', 'runny_nose',
                'congestion', 'chest_pain', 'weakness_in_limbs', 'fast_heart_rate',
                'pain_during_bowel_movements', 'pain_in_anal_region', 'bloody_stool',
                'irritation_in_anus', 'neck_pain', 'dizziness', 'cramps', 'bruising', 'obesity',
                'swollen_legs', 'swollen_blood_vessels', 'puffy_face_and_eyes', 'enlarged_thyroid',
                'brittle_nails', 'swollen_extremeties', 'excessive_hunger', 'extra_marital_contacts',
                'drying_and_tingling_lips', 'slurred_speech', 'knee_pain', 'hip_joint_pain',
                'muscle_weakness', 'stiff_neck', 'swelling_joints', 'movement_stiffness',
                'spinning_movements', 'loss_of_balance', 'unsteadiness', 'weakness_of_one_body_side',
                'loss_of_smell', 'bladder_discomfort', 'foul_smell_of urine',
                'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching', 'toxic_look_(typhos)',
                'depression', 'irritability', 'muscle_pain', 'altered_sensorium',
                'red_spots_over_body', 'belly_pain', 'abnormal_menstruation', 'dischromic _patches',
                'watering_from_eyes', 'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum',
                'rusty_sputum', 'lack_of_concentration', 'visual_disturbances', 'receiving_blood_transfusion',
                'receiving_unsterile_injections', 'coma', 'stomach_bleeding', 'distention_of_abdomen',
                'history_of_alcohol_consumption', 'fluid_overload',
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

        validSymptoms.forEach(sym => {
            const readableSym = sym.replace(/_/g, ' ');
            if (inputLower.includes(readableSym)) {
                matchedSymptoms.push(sym);
            }
        });

        // Check for follow-up conversational queries ONLY IF no new symptoms were detected
        if (matchedSymptoms.length === 0 && !hasUrgentKeyword && !hasHighRiskKeyword) {
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

            const cacheKey = `${req.user.id}_${actualPatientId}`;

            if ((isFollowUpCause || isFollowUpPrecaution || isGenericFollowUp) && patientLastDiseaseCache[cacheKey]) {
                const cachedDisease = patientLastDiseaseCache[cacheKey];
                try {
                    let mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
                    mlServiceUrl = mlServiceUrl.replace(/\/+$/, '');
                    const infoResponse = await fetch(`${mlServiceUrl}/api/v1/disease-info/${encodeURIComponent(cachedDisease)}`, {
                        headers: getMlHeaders()
                    });
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
                            if (isFollowUpCause && isFollowUpPrecaution) {
                                recommendation = `Here is what causes ${infoData.disease}: ${infoData.description}\n\nTo manage/prevent it, you should follow these precautions: ${infoData.precautions.join(', ')}.`;
                            } else if (isFollowUpCause) {
                                recommendation = `Here is what causes ${infoData.disease}: ${infoData.description}`;
                            } else if (isFollowUpPrecaution) {
                                recommendation = `To manage/prevent ${infoData.disease}, you should follow these precautions: ${infoData.precautions.join(', ')}.`;
                            } else {
                                recommendation = `Here is more information about ${infoData.disease}: ${infoData.description}`;
                            }

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
            // Strictly match when the user explicitly asks about a disease
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
                let mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
                mlServiceUrl = mlServiceUrl.replace(/\/+$/, '');
                let infoResponse;
                for (let attempt = 1; attempt <= 4; attempt++) {
                    infoResponse = await fetch(`${mlServiceUrl}/api/v1/disease-info/${encodeURIComponent(directDiseaseMatch)}`, {
                        headers: getMlHeaders()
                    });
                    if (infoResponse.ok) break;
                    console.warn(`ML service disease-info attempt ${attempt} failed with status: ${infoResponse.status}`);
                    if (attempt < 4) {
                        const waitTime = (10000 + (attempt * 5000));
                        await new Promise(res => setTimeout(res, waitTime));
                    }
                }

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
                        patientLastDiseaseCache[`${req.user.id}_${actualPatientId}`] = infoData.disease;

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
                let mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
                mlServiceUrl = mlServiceUrl.replace(/\/+$/, '');
                let mlResponse;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    mlResponse = await fetch(`${mlServiceUrl}/api/v1/predict/disease`, {
                        method: 'POST',
                        headers: getMlHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ symptoms: matchedSymptoms })
                    });
                    if (mlResponse.ok) break;
                    console.warn(`ML service prediction attempt ${attempt} failed with status: ${mlResponse.status}`);
                    if (attempt < 3) await new Promise(res => setTimeout(res, 2000));
                }

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
        // Key it by a combination of user_id and patient_id to prevent cross-family member bleeding
        if (predictionsList && predictionsList.length > 0) {
            const cacheKey = `${req.user.id}_${actualPatientId}`;
            patientLastDiseaseCache[cacheKey] = predictionsList[0].disease;
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

exports.predictParkinsons = async (req, res) => {
    const { tremorVariance, tapCount, tapAvgIntervalMs, tapVariabilityMs, voiceMatchPercent } = req.body;

    try {
        const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patientRows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        const actualPatientId = patientRows[0].id;

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await fetch(`${mlServiceUrl}/api/v1/predict/parkinsons/from-tests`, {
            method: 'POST',
            headers: getMlHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                tremorVariance: parseFloat(tremorVariance || 0),
                tapCount: parseInt(tapCount || 0),
                tapAvgIntervalMs: parseFloat(tapAvgIntervalMs || 0),
                tapVariabilityMs: parseFloat(tapVariabilityMs || 0),
                voiceMatchPercent: parseFloat(voiceMatchPercent || 0)
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`ML Service responded with status ${response.status}: ${errText}`);
        }

        const result = await response.json();

        // Map riskLabel to dbRisk
        let dbRisk = 'Low';
        if (result.riskLabel === 'High Risk') dbRisk = 'High';
        else if (result.riskLabel === 'Moderate Risk') dbRisk = 'Medium';

        // Persist to database
        const symptomsJson = JSON.stringify(['tremor', 'bradykinesia', 'vocal monotony']);
        await db.execute(
            `INSERT INTO ai_triage_logs (patient_id, user_input, extracted_symptoms, predicted_risk)
             VALUES (?, ?, ?, ?)`,
            [actualPatientId, "Parkinson's Disease Home Screening Test", symptomsJson, dbRisk]
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Parkinsons Prediction Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// ─────────────────────────────────────────────────────────────
// D. Patient Appointment History
// ─────────────────────────────────────────────────────────────
exports.getAppointments = async (req, res) => {
    const { patientId } = req.params;
    try {
        // IDOR Check: Ensure patientId belongs to the authenticated user
        const [patientRows] = await db.query('SELECT user_id FROM patients WHERE id = ?', [patientId]);
        if (patientRows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        if (patientRows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized access to patient record' });
        }

        const appointments = await appointmentService.getAppointments(patientId);
        res.status(200).json(appointments);
    } catch (error) {
        console.error('Fetch Appointments Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getFamilyAppointments = async (req, res) => {
    const userId = req.user.id;
    try {
        const appointments = await appointmentService.getFamilyAppointments(userId);
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
    const userId = req.user.id;
    try {
        const patients = await patientService.getFamilyMembers(userId);
        res.status(200).json(patients);
    } catch (error) {
        console.error('Fetch Family Members Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.addFamilyMember = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await patientService.addFamilyMember(userId, req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'Name and gender are required') {
            return res.status(400).json({ message: error.message });
        }
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
    try {
        const { patient_id } = req.body;
        if (!patient_id) {
            return res.status(400).json({ message: 'Missing required booking fields: patient_id' });
        }
        // IDOR Check: Ensure patient_id belongs to the authenticated user
        const [patientRows] = await db.query('SELECT user_id FROM patients WHERE id = ?', [patient_id]);
        if (patientRows.length === 0 || patientRows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized patient_id' });
        }

        const result = await appointmentService.bookAppointment(req.body);
        if (req.io) req.io.emit('QUEUE_UPDATE', { clinicId: result.clinicId });
        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error) {
        if (error.message.startsWith('Missing required booking fields')) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Book Appointment Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.cancelAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        // IDOR Check: Ensure appointment belongs to the authenticated user
        const [appRows] = await db.query(
            `SELECT a.id FROM appointments a 
             JOIN patients p ON a.patient_id = p.id 
             WHERE a.id = ? AND p.user_id = ?`,
            [appointmentId, req.user.id]
        );
        if (appRows.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized access to appointment' });
        }

        await appointmentService.cancelAppointment(appointmentId);
        if (req.io) req.io.emit('QUEUE_UPDATE', {}); 
        res.status(200).json({ message: 'Appointment canceled successfully' });
    } catch (error) {
        console.error('Cancel Appointment Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.rescheduleAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        // IDOR Check: Ensure appointment belongs to the authenticated user
        const [appRows] = await db.query(
            `SELECT a.id FROM appointments a 
             JOIN patients p ON a.patient_id = p.id 
             WHERE a.id = ? AND p.user_id = ?`,
            [appointmentId, req.user.id]
        );
        if (appRows.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized access to appointment' });
        }

        await appointmentService.rescheduleAppointment(appointmentId, req.body.new_date);
        if (req.io) req.io.emit('QUEUE_UPDATE', {});
        res.status(200).json({ message: 'Appointment rescheduled successfully' });
    } catch (error) {
        if (error.message === 'New date is required') {
            return res.status(400).json({ message: error.message });
        }
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
        // IDOR Check: Ensure patient_id belongs to the authenticated user
        const [patientRows] = await db.query('SELECT user_id FROM patients WHERE id = ?', [patient_id]);
        if (patientRows.length === 0 || patientRows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized patient_id' });
        }

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

// ─────────────────────────────────────────────────────────────
// H. Patient Profile & Password Settings
// ─────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id as user_id, u.name, u.email, u.phone, u.profile_image, u.auth_provider,
                    p.id as patient_id, p.mrn, p.date_of_birth, p.gender, p.blood_group, p.emergency_contact
             FROM users u
             LEFT JOIN patients p ON u.id = p.user_id
             WHERE u.id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    const { name, email, phone, date_of_birth, gender, blood_group, emergency_contact } = req.body;
    try {
        const [users] = await db.query('SELECT auth_provider, email FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = users[0];

        // 1. Validation for Email/Phone format
        if (email && email !== user.email) {
            if (user.auth_provider === 'google') {
                return res.status(400).json({ success: false, message: 'Google users cannot change their email address.' });
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email address format.' });
            }
            // Check uniqueness
            const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
            if (existingEmail.length > 0) {
                return res.status(400).json({ success: false, message: 'Email address already registered by another user.' });
            }
        }

        // Phone validation
        if (phone) {
            const cleanPhone = phone.trim();
            if (!cleanPhone.startsWith('+')) {
                return res.status(400).json({ success: false, message: 'Phone number must start with a country code (e.g. +91).' });
            }
            // Check uniqueness
            const [existingPhone] = await db.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, req.user.id]);
            if (existingPhone.length > 0) {
                return res.status(400).json({ success: false, message: 'Phone number already registered by another user.' });
            }
        }

        // Validate Date of Birth is not in the future
        if (date_of_birth) {
            const birthDate = new Date(date_of_birth);
            const today = new Date();
            if (birthDate > today) {
                return res.status(400).json({ success: false, message: 'Date of birth cannot be a future date.' });
            }
        }

        // 2. Perform updates
        const finalEmail = user.auth_provider === 'google' ? user.email : (email || user.email);
        await db.query(
            `UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?`,
            [name, finalEmail, phone, req.user.id]
        );

        await db.query(
            `UPDATE patients SET name = ?, date_of_birth = ?, gender = ?, blood_group = ?, emergency_contact = ? WHERE user_id = ?`,
            [name, date_of_birth || null, gender, blood_group || null, emergency_contact || null, req.user.id]
        );

        res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcrypt');
    try {
        const [users] = await db.query('SELECT password, auth_provider FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = users[0];

        if (user.auth_provider === 'google') {
            return res.status(400).json({ success: false, message: 'Google users cannot change/reset password.' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password.' });
        }

        // Validate new password rules
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
        }
        const hasUppercase = /[A-Z]/.test(newPassword);
        const hasLowercase = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
        if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 numeric value, and 1 special character.' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file uploaded.' });
        }

        let imageUrl = '';
        if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'demo') {
            console.warn("Cloudinary not configured, using a default mock URL.");
            imageUrl = "https://res.cloudinary.com/demo/image/upload/v1/mock_avatar.png";
        } else {
            const cloudinary = require('../config/cloudinary');
            const streamifier = require('streamifier');

            const uploadFromBuffer = (req) => {
                return new Promise((resolve, reject) => {
                    let cld_upload_stream = cloudinary.uploader.upload_stream(
                        { folder: "healtrack_avatars" },
                        (error, result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(error);
                            }
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
                });
            };

            const result = await uploadFromBuffer(req);
            imageUrl = result.secure_url;
        }

        await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imageUrl, req.user.id]);

        res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully.',
            data: { profile_image: imageUrl }
        });
    } catch (error) {
        console.error('Upload Profile Image Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

