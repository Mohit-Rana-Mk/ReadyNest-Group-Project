require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'team_project',
        ssl: process.env.DB_SSL === 'true' ? {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        } : undefined
    });

    console.log('Connected to DB. Seeding...');

    try {
        // Truncate tables correctly
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = ['users', 'patients', 'doctor_schedules', 'services', 'clinics', 'clinic_services', 'appointments', 'prescriptions', 'prescription_items', 'patient_vitals', 'clinic_reviews', 'preventive_recommendations', 'ai_triage_logs'];
        for (const table of tables) {
            await db.query(`TRUNCATE TABLE ${table}`);
        }
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Seeding Database...");

        // Clinics
        await db.query(`INSERT INTO clinics (id, name, license_number, address, city, postal_code, latitude, longitude, verification_status) VALUES 
            (1, 'HealTrack Central Hospital', 'LIC-99882200', '123 Health Ave', 'Mumbai', '400001', 19.0760, 72.8777, 'Approved')
        `);

        // Services
        await db.query(`INSERT INTO services (id, name, description) VALUES 
            (1, 'Cardiology', 'Heart related checkups'),
            (2, 'General Medicine', 'General physical checks'),
            (3, 'Ophthalmology', 'Eye checkups'),
            (4, 'Orthopedics', 'Bone related checkups')
        `);

        // Hash password
        const passwordHash = await bcrypt.hash('password123', 10);

        // Users
        await db.query(`INSERT INTO users (id, name, email, phone, password, role, status, service_id, clinic_id) VALUES 
            (1, 'Super Admin', 'superadmin@healtrack.com', '1000000001', ?, 'SuperAdmin', 'Active', NULL, NULL),
            (2, 'Dr. Vikram Sharma', 'vikram@healtrack.com', '1000000002', ?, 'Doctor', 'Active', 1, 1),
            (3, 'Dr. Anjali Desai', 'anjali@healtrack.com', '1000000003', ?, 'Doctor', 'Active', 2, 1),
            (4, 'Rahul Verma', 'rahul@healtrack.com', '1000000004', ?, 'ClinicStaff', 'Active', NULL, 1),
            (5, 'Patient One', 'patient1@mail.com', '1000000005', ?, 'Patient', 'Active', NULL, NULL),
            (6, 'Patient Two', 'patient2@mail.com', '1000000006', ?, 'Patient', 'Active', NULL, NULL),
            (7, 'Clinic Admin', 'admin@healtrack.com', '1000000007', ?, 'ClinicAdmin', 'Active', NULL, 1)
        `, [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash, passwordHash]);

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

        // Seed Payments
        console.log("Seeding Payments...");
        await db.query(`INSERT INTO payments (id, patient_id, doctor_id, clinic_id, appointment_id, razorpay_order_id, razorpay_payment_id, amount, status, receipt_id, invoice_id) VALUES 
            (1, 1, 2, 1, 1, 'order_mock_001', 'pay_mock_001', 1200.00, 'Paid', 'rcpt_mock_001', 'INV-mock-001'),
            (2, 2, 3, 1, 2, 'order_mock_002', NULL, 600.00, 'Pending', 'rcpt_mock_002', 'INV-mock-002'),
            (3, 1, 2, 1, 3, 'order_mock_003', 'pay_mock_003', 1200.00, 'Refunded', 'rcpt_mock_003', 'INV-mock-003')
        `);

        // Seed Refund Requests
        console.log("Seeding Refund Requests...");
        await db.query(`INSERT INTO refund_requests (id, payment_id, amount, reason, status, processed_at) VALUES 
            (1, 3, 1200.00, 'cancellation', 'Approved', NOW())
        `);

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Database seeded successfully!');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await db.end();
    }
}

seed();
