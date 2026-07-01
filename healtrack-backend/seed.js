require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'team_project'
    });

    console.log('Connected to DB. Seeding...');

    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // Truncate
        await db.query('TRUNCATE TABLE appointments');
        await db.query('TRUNCATE TABLE doctor_schedules');
        await db.query('TRUNCATE TABLE patients');
        await db.query('TRUNCATE TABLE clinic_services');
        await db.query('TRUNCATE TABLE services');
        await db.query('TRUNCATE TABLE clinics');
        await db.query('TRUNCATE TABLE users');

        // Users
        // Users (Assign Dr. Vikram to Cardiology (1) and Dr. Anjali to General Medicine (2))
        await db.query(`INSERT INTO users (id, name, email, phone, password, role, status, service_id) VALUES 
            (1, 'Admin', 'admin@healtrack.com', '1000000001', 'hash', 'Admin', 'Active', NULL),
            (2, 'Dr. Vikram Sharma', 'vikram@healtrack.com', '1000000002', 'hash', 'Doctor', 'Active', 1),
            (3, 'Dr. Anjali Desai', 'anjali@healtrack.com', '1000000003', 'hash', 'Doctor', 'Active', 2),
            (4, 'Rahul Verma', 'rahul@healtrack.com', '1000000004', 'hash', 'ClinicStaff', 'Active', NULL),
            (5, 'Patient One', 'patient1@mail.com', '1000000005', 'hash', 'Patient', 'Active', NULL),
            (6, 'Patient Two', 'patient2@mail.com', '1000000006', 'hash', 'Patient', 'Active', NULL)
        `);

        // Clinics
        await db.query(`INSERT INTO clinics (id, name, license_number, address, city, postal_code, location, verification_status) VALUES 
            (1, 'HealTrack Central Hospital', 'LIC-99882200', '123 Health Ave', 'Mumbai', '400001', ST_GeomFromText('POINT(72.8777 19.0760)', 4326), 'Approved')
        `);

        // Services
        await db.query(`INSERT INTO services (id, name, description) VALUES 
            (1, 'Cardiology', 'Heart related checkups'),
            (2, 'General Medicine', 'General physical checks'),
            (3, 'Ophthalmology', 'Eye checkups'),
            (4, 'Orthopedics', 'Bone related checkups')
        `);

        // Clinic Services
        await db.query(`INSERT INTO clinic_services (clinic_id, service_id, consultation_fee) VALUES 
            (1, 1, 1200.00),
            (1, 2, 600.00),
            (1, 3, 800.00),
            (1, 4, 1000.00)
        `);

        // Patients
        await db.query(`INSERT INTO patients (id, user_id, mrn, name, date_of_birth, gender, blood_group) VALUES 
            (1, 5, 'PT-2026-0001', 'Patient One', '1990-01-01', 'Male', 'O+'),
            (2, 6, 'PT-2026-0002', 'Patient Two', '1985-05-15', 'Female', 'A-')
        `);

        // Doctor Schedules
        await db.query(`INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time) VALUES 
            (2, 1, 'Monday', '09:00:00', '17:00:00'),
            (3, 1, 'Tuesday', '09:00:00', '17:00:00')
        `);

        // Appointments (Today and Past 6 months)
        let appointmentQueries = [];
        let idCounter = 1;

        // Today's appointments (Operations Overview)
        appointmentQueries.push(`(
            ${idCounter++}, 1, 1, 2, NOW(), 'Scheduled', 'General checkup'
        )`);
        appointmentQueries.push(`(
            ${idCounter++}, 1, 2, 3, NOW(), 'In Consultation', 'Heart issues'
        )`);
        appointmentQueries.push(`(
            ${idCounter++}, 1, 1, 2, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Completed', 'Follow up'
        )`);

        // Past 6 months (Analytics Dashboard) - Generate random completed appointments
        const months = [1, 2, 3, 4, 5, 6];
        months.forEach(month => {
            // Insert 3-5 random completed appointments per month
            const count = Math.floor(Math.random() * 3) + 3; 
            for(let i=0; i<count; i++) {
                appointmentQueries.push(`(
                    ${idCounter++}, 1, 1, 2, DATE_SUB(NOW(), INTERVAL ${month} MONTH), 'Completed', 'Past visit'
                )`);
            }
        });

        await db.query(`INSERT INTO appointments (id, clinic_id, patient_id, doctor_id, appointment_date, status, pre_remarks) VALUES ${appointmentQueries.join(',')}`);

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Database seeded successfully!');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await db.end();
    }
}

seed();
