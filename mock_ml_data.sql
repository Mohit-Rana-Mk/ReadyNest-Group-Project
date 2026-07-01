-- Insert a mock service for the ML recommendation
INSERT IGNORE INTO services (id, name, description) VALUES (99, 'Fasting Blood Sugar Test', 'ML Suggested Diagnostic');

-- Insert mock ML preventive alerts for patient ID 1 (which is usually the default test patient)
INSERT IGNORE INTO preventive_recommendations (patient_id, target_service_id, alert_title, alert_description, status, generated_by) 
VALUES 
(1, 99, 'Diabetic Risk Profile Detected', 'Based on your recent vitals and symptom history, our ML risk model recommends a routine Fasting Blood Sugar test to rule out early-stage diabetes.', 'Pending', 'AI Engine'),
(1, 1, 'Cardiovascular Follow-up', 'An analysis of your past blood pressure trends indicates a moderate risk of hypertension. We recommend a general consultation.', 'Pending', 'AI Engine');
