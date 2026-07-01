CREATE DATABASE IF NOT EXISTS team_project;
USE team_project;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS doctor_schedules;
DROP TABLE IF EXISTS preventive_recommendations;
DROP TABLE IF EXISTS patient_vitals;
DROP TABLE IF EXISTS ai_triage_logs;
DROP TABLE IF EXISTS clinic_services;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS clinic_reviews;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS clinics;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------------------
-- 1. USERS TABLE (Core Authentication)
-- -------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Patient', 'Doctor', 'Admin', 'ClinicStaff') NOT NULL,
    status ENUM('Active', 'Suspended') DEFAULT 'Active',
    service_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. PATIENTS TABLE (Extended Patient Clinical Profile)
-- -------------------------------------------------------------------------
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mrn VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NULL,
    gender ENUM('Male', 'Female', 'Other', 'Prefer Not to Say') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL,
    emergency_contact VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. CLINICS TABLE (Multi-Tenant Facility Registry with Geospatial Tracking)
-- -------------------------------------------------------------------------
CREATE TABLE clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    location POINT NOT NULL SRID 4326, 
    verification_status ENUM('Pending', 'Approved', 'Delisted') DEFAULT 'Pending',
    opening_time TIME NULL,
    closing_time TIME NULL,
    operational_days VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_clinic_location (location),
    INDEX idx_clinic_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. APPOINTMENTS TABLE (Operational OPD Queue Scheduler)
-- -------------------------------------------------------------------------
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL, 
    appointment_date DATETIME NOT NULL,
    status ENUM('Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    booking_source ENUM('App', 'Portal', 'Walk-in') DEFAULT 'App',
    pre_remarks TEXT NULL,  
    post_remarks TEXT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_appt_date_status (appointment_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. PRESCRIPTIONS TABLE (Clinical Encounter Master Record)
-- -------------------------------------------------------------------------
CREATE TABLE prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    diagnosis VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. PRESCRIPTION_ITEMS TABLE (Granular Line-by-Line Medication Ledger)
-- -------------------------------------------------------------------------
CREATE TABLE prescription_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,      
    frequency VARCHAR(100) NOT NULL,   
    duration VARCHAR(50) NOT NULL,     
    instructions VARCHAR(255) NULL,    
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 7. CLINIC_REVIEWS TABLE (Patient Feedback & Ratings Engine)
-- -------------------------------------------------------------------------
CREATE TABLE clinic_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT NOT NULL,
    patient_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_clinic_review (patient_id, clinic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 8. SERVICES TABLE (Master Dictionary of Specialized Treatment Categories)
-- -------------------------------------------------------------------------
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, 
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 9. CLINIC_SERVICES TABLE (Many-to-Many Operational Capacity Mapping)
-- -------------------------------------------------------------------------
CREATE TABLE clinic_services (
    clinic_id INT NOT NULL,
    service_id INT NOT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (clinic_id, service_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 10. AI_TRIAGE_LOGS (Asynchronous Historical Records Parsing Ledger)
-- -------------------------------------------------------------------------
CREATE TABLE ai_triage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    user_input TEXT NOT NULL,           
    extracted_symptoms JSON NOT NULL,    
    predicted_risk ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    recommended_service_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (recommended_service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 11. PATIENT_VITALS (Structured Table for Numerical Tracking Over Time)
-- -------------------------------------------------------------------------
CREATE TABLE patient_vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    weight_kg DECIMAL(5,2) NULL,
    height_cm DECIMAL(5,2) NULL,
    systolic_bp INT NULL,   
    diastolic_bp INT NULL,  
    blood_sugar_mgdl INT NULL,
    pulse_rate INT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 12. PREVENTIVE_RECOMMENDATIONS (Ledger for Proactive AI Engine Alerts)
-- -------------------------------------------------------------------------
CREATE TABLE preventive_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    alert_title VARCHAR(255) NOT NULL, 
    alert_description TEXT NOT NULL,
    target_service_id INT NOT NULL,    
    status ENUM('Pending', 'Booked', 'Ignored') DEFAULT 'Pending',
    generated_by ENUM('System_Cron', 'Doctor_Flag') DEFAULT 'System_Cron',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (target_service_id) REFERENCES services(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 13. DOCTOR_SCHEDULES (Registry for Operational Availability)
-- -------------------------------------------------------------------------
CREATE TABLE doctor_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL, 
    clinic_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients_per_shift INT DEFAULT 20,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_shift (doctor_id, clinic_id, day_of_week, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key for users (Doctors) -> services (Departments)
ALTER TABLE users ADD CONSTRAINT fk_user_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

SHOW TABLES;