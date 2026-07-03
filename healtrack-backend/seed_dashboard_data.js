require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'team_project'
    });

    console.log('Connected to DB. Starting high-fidelity dashboard seeding...');

    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // Truncate existing tables to start clean
        await db.query('TRUNCATE TABLE appointments');
        await db.query('TRUNCATE TABLE prescriptions');
        await db.query('TRUNCATE TABLE prescription_items');
        await db.query('TRUNCATE TABLE patients');
        await db.query('TRUNCATE TABLE doctor_schedules');
        await db.query('TRUNCATE TABLE clinic_services');
        await db.query('TRUNCATE TABLE services');
        await db.query('TRUNCATE TABLE clinics');
        await db.query('TRUNCATE TABLE users');

        // 1. Insert services (10 departments)
        const services = [
            { id: 1, name: 'Cardiology', desc: 'Heart related checkups' },
            { id: 2, name: 'General Medicine', desc: 'General health and physical checks' },
            { id: 3, name: 'Ophthalmology', desc: 'Eye examinations and surgeries' },
            { id: 4, name: 'Orthopedics', desc: 'Bone, joint, and muscle therapies' },
            { id: 5, name: 'Pediatrics', desc: 'Child health care services' },
            { id: 6, name: 'Dermatology', desc: 'Skin, hair, and nail treatments' },
            { id: 7, name: 'ENT', desc: 'Ear, Nose, and Throat checks' },
            { id: 8, name: 'Neurology', desc: 'Brain and nervous system treatments' },
            { id: 9, name: 'Gynecology', desc: 'Women health and maternity checks' },
            { id: 10, name: 'Psychiatry', desc: 'Mental health and wellness guidance' }
        ];

        for (let s of services) {
            await db.query('INSERT INTO services (id, name, description) VALUES (?, ?, ?)', [s.id, s.name, s.desc]);
        }
        console.log('Inserted 10 services.');

        // 2. Insert Clinics
        await db.query(`INSERT INTO clinics (id, name, license_number, address, city, postal_code, latitude, longitude, verification_status) VALUES 
            (1, 'HealTrack Central Hospital', 'LIC-99882200', '123 Health Ave', 'Mumbai', '400001', 19.0760, 72.8777, 'Approved')
        `);
        console.log('Inserted HealTrack Central Hospital.');

        // 3. Insert Clinic Services (fees corresponding to departments)
        const fees = {
            1: 1500.00, // Cardiology
            2: 500.00,  // General Medicine
            3: 800.00,  // Ophthalmology
            4: 1200.00, // Orthopedics
            5: 600.00,  // Pediatrics
            6: 900.00,  // Dermatology
            7: 750.00,  // ENT
            8: 1800.00, // Neurology
            9: 1000.00, // Gynecology
            10: 1100.00 // Psychiatry
        };

        for (let serviceId in fees) {
            await db.query('INSERT INTO clinic_services (clinic_id, service_id, consultation_fee) VALUES (1, ?, ?)', [serviceId, fees[serviceId]]);
        }
        console.log('Inserted clinic services fees.');

        // 4. Insert Admins, Staff, & Doctors
        const passwordHash = await bcrypt.hash('password123', 10);
        await db.query(`INSERT INTO users (id, name, email, phone, password, role, status, service_id, clinic_id) VALUES 
            (1, 'Super Admin', 'superadmin@healtrack.com', '1000000001', ?, 'SuperAdmin', 'Active', NULL, NULL),
            (16, 'Clinic Admin', 'admin@healtrack.com', '1000000015', ?, 'ClinicAdmin', 'Active', NULL, 1),
            (17, 'Receptionist', 'reception@healtrack.com', '1000000016', ?, 'ClinicStaff', 'Active', NULL, 1)
        `, [passwordHash, passwordHash, passwordHash]);

        const doctors = [
            { id: 2, name: 'Dr. Vivek Nair', service_id: 5, email: 'vivek@healtrack.com', phone: '2000000001' },       // Pediatrics
            { id: 3, name: 'Dr. Shalini Desai', service_id: 9, email: 'shalini@healtrack.com', phone: '2000000002' },   // Gynecology
            { id: 4, name: 'Dr. Ritu Sharma', service_id: 2, email: 'ritu@healtrack.com', phone: '2000000003' },       // General Medicine
            { id: 5, name: 'Dr. Neha Kapoor', service_id: 6, email: 'neha@healtrack.com', phone: '2000000004' },       // Dermatology
            { id: 6, name: 'Dr. Kavitha Reddy', service_id: 2, email: 'kavitha@healtrack.com', phone: '2000000005' },   // General Medicine
            { id: 7, name: 'Dr. Rakesh Mehta', service_id: 1, email: 'rakesh@healtrack.com', phone: '2000000006' },     // Cardiology
            { id: 8, name: 'Dr. Suresh Iyer', service_id: 7, email: 'suresh@healtrack.com', phone: '2000000007' },       // ENT
            { id: 9, name: 'Dr. Anil Kapoor', service_id: 4, email: 'anil@healtrack.com', phone: '2000000008' },       // Orthopedics
            { id: 10, name: 'Dr. Meena Pillai', service_id: 3, email: 'meena@healtrack.com', phone: '2000000009' },    // Ophthalmology
            { id: 11, name: 'Dr. Ashok Gupta', service_id: 10, email: 'ashok@healtrack.com', phone: '2000000010' },    // Psychiatry
            { id: 12, name: 'Dr. Geeta Singh', service_id: 9, email: 'geeta@healtrack.com', phone: '2000000011' },     // Gynecology
            { id: 13, name: 'Dr. Manoj Verma', service_id: 8, email: 'manoj@healtrack.com', phone: '2000000012' },     // Neurology
            { id: 14, name: 'Dr. Sunita Rao', service_id: 6, email: 'sunita@healtrack.com', phone: '2000000013' },     // Dermatology
            { id: 15, name: 'Dr. Farah Khan', service_id: 5, email: 'farah@healtrack.com', phone: '2000000014' }       // Pediatrics
        ];

        for (let doc of doctors) {
            await db.query(
                `INSERT INTO users (id, name, email, phone, password, role, status, service_id, clinic_id) VALUES (?, ?, ?, ?, ?, 'Doctor', 'Active', ?, 1)`,
                [doc.id, doc.name, doc.email, doc.phone, passwordHash, doc.service_id]
            );
            // Insert schedule
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (let day of days) {
                await db.query(
                    `INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time) VALUES (?, 1, ?, '09:00:00', '17:00:00')`,
                    [doc.id, day]
                );
            }
        }
        console.log('Inserted 14 doctors and schedules.');

        // 5. Insert 454 Patients
        // Age/Gender distribution: 244 Females (53.74%), 210 Males (46.26%), total 454.
        const firstNamesMale = ['Amit', 'Rohit', 'Rajesh', 'Sanjay', 'Rahul', 'Vikram', 'Anil', 'Suresh', 'Manish', 'Vijay', 'Arun', 'Karan', 'Sunil', 'Alok', 'Deepak', 'Ravi', 'Vivek', 'Manoj', 'Ashok', 'Gaurav'];
        const firstNamesFemale = ['Priya', 'Sneha', 'Neha', 'Pooja', 'Anita', 'Divya', 'Kavita', 'Swati', 'Anjali', 'Ritu', 'Shalini', 'Sunita', 'Farah', 'Geeta', 'Meena', 'Kiran', 'Asha', 'Jyoti', 'Preeti', 'Rupa'];
        const lastNames = ['Sharma', 'Desai', 'Verma', 'Kapoor', 'Reddy', 'Mehta', 'Iyer', 'Gupta', 'Singh', 'Pillai', 'Rao', 'Khan', 'Nair', 'Joshi', 'Patel', 'Kumar', 'Sen', 'Dutta', 'Das', 'Bose'];

        let patientsList = [];
        let patientUserIdStart = 100; // user ids for patients start at 100

        // Create 244 Females
        for (let i = 1; i <= 244; i++) {
            const first = firstNamesFemale[i % firstNamesFemale.length];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${first} ${last}`;
            const age = Math.floor(Math.random() * 83) + 2; // ages 2 to 85
            const birthYear = 2026 - age;
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            const dob = `${birthYear}-${birthMonth}-${birthDay}`;
            
            patientsList.push({
                userId: patientUserIdStart + i,
                name: name,
                gender: 'Female',
                dob: dob,
                email: `${first.toLowerCase()}${i}@mail.com`,
                phone: `90000${String(i).padStart(5, '0')}`,
                mrn: `PT-2026-${String(i).padStart(4, '0')}`
            });
        }

        // Create 210 Males
        for (let i = 1; i <= 210; i++) {
            const first = firstNamesMale[i % firstNamesMale.length];
            const last = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${first} ${last}`;
            const age = Math.floor(Math.random() * 83) + 2; // ages 2 to 85
            const birthYear = 2026 - age;
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            const dob = `${birthYear}-${birthMonth}-${birthDay}`;
            const idx = 244 + i;
            
            patientsList.push({
                userId: patientUserIdStart + idx,
                name: name,
                gender: 'Male',
                dob: dob,
                email: `${first.toLowerCase()}${idx}@mail.com`,
                phone: `90000${String(idx).padStart(5, '0')}`,
                mrn: `PT-2026-${String(idx).padStart(4, '0')}`
            });
        }

        // Insert patient users and profiles in batches
        for (let p of patientsList) {
            await db.query(
                `INSERT INTO users (id, name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, 'Patient', 'Active')`,
                [p.userId, p.name, p.email, p.phone, passwordHash]
            );
            await db.query(
                `INSERT INTO patients (user_id, mrn, name, date_of_birth, gender, blood_group) VALUES (?, ?, ?, ?, ?, 'O+')`,
                [p.userId, p.mrn, p.name, p.dob, p.gender]
            );
        }
        console.log(`Inserted ${patientsList.length} patients and users.`);

        // 6. Insert 600 Appointments
        // Date range: 01-01-2026 to 30-06-2026
        // Total = 600. Cancelled = 73 (12.17% no-show rate)
        // Completed = 485, Scheduled = 30, In Consultation = 12
        const startDate = new Date('2026-01-01T08:00:00');
        const endDate = new Date('2026-06-30T18:00:00');
        const totalApptsCount = 600;
        const cancelledApptsCount = 73;
        const inConsultationCount = 12;
        const scheduledCount = 30;
        const completedCount = totalApptsCount - cancelledApptsCount - inConsultationCount - scheduledCount; // 485

        const statuses = [];
        for (let i = 0; i < cancelledApptsCount; i++) statuses.push('Cancelled');
        for (let i = 0; i < inConsultationCount; i++) statuses.push('In Consultation');
        for (let i = 0; i < scheduledCount; i++) statuses.push('Scheduled');
        for (let i = 0; i < completedCount; i++) statuses.push('Completed');

        // Shuffle statuses
        for (let i = statuses.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
        }

        // Load generated patient IDs from DB
        const [patientsRows] = await db.query('SELECT id, date_of_birth, gender FROM patients');
        const patientObjs = patientsRows.map(r => ({ id: r.id, dob: r.date_of_birth, gender: r.gender }));

        // Distribution of appointments over hours: peaks at 10-12 and 14-16
        const hoursDistribution = [8, 9, 10, 11, 11, 11, 12, 13, 14, 15, 15, 16, 17, 18];

        let appointmentsList = [];
        let totalRevenueTarget = 338000;
        let runningRevenue = 0;

        for (let i = 1; i <= totalApptsCount; i++) {
            const status = statuses[i - 1];
            const patient = patientObjs[i % patientObjs.length];
            // Select random doctor
            const doc = doctors[Math.floor(Math.random() * doctors.length)];
            const fee = fees[doc.service_id];

            // Get random date in range
            const timeDiff = endDate.getTime() - startDate.getTime();
            const randomTime = startDate.getTime() + Math.random() * timeDiff;
            const apptDate = new Date(randomTime);
            
            // Adjust hour and minutes
            const randomHour = hoursDistribution[Math.floor(Math.random() * hoursDistribution.length)];
            const randomMinutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
            apptDate.setHours(randomHour, randomMinutes, 0, 0);

            // Format date for SQL
            const formattedDate = apptDate.toISOString().slice(0, 19).replace('T', ' ');

            appointmentsList.push({
                id: i,
                clinicId: 1,
                patientId: patient.id,
                doctorId: doc.id,
                date: formattedDate,
                status: status,
                fee: fee
            });

            if (status === 'Completed') {
                runningRevenue += fee;
            }
        }

        // Adjust appointments to hit around 338K revenue
        // If runningRevenue is too low, switch some lower-fee doctor appointments to higher-fee doctors for Completed ones
        let attempts = 0;
        while (Math.abs(runningRevenue - totalRevenueTarget) > 5000 && attempts < 100) {
            attempts++;
            for (let appt of appointmentsList) {
                if (appt.status === 'Completed') {
                    const currentDoc = doctors.find(d => d.id === appt.doctorId);
                    const currentFee = fees[currentDoc.service_id];
                    
                    if (runningRevenue < totalRevenueTarget && currentFee < 1000) {
                        // Change to a higher fee doctor
                        const highDoc = doctors.find(d => fees[d.service_id] >= 1200);
                        appt.doctorId = highDoc.id;
                        runningRevenue += (fees[highDoc.service_id] - currentFee);
                    } else if (runningRevenue > totalRevenueTarget && currentFee > 1000) {
                        // Change to a lower fee doctor
                        const lowDoc = doctors.find(d => fees[d.service_id] <= 600);
                        appt.doctorId = lowDoc.id;
                        runningRevenue -= (currentFee - fees[lowDoc.service_id]);
                    }
                }
                if (Math.abs(runningRevenue - totalRevenueTarget) <= 5000) break;
            }
        }
        console.log(`Generated appointments with simulated Completed Revenue: INR ${runningRevenue}`);

        // Insert appointments
        for (let appt of appointmentsList) {
            await db.query(
                `INSERT INTO appointments (id, clinic_id, patient_id, doctor_id, appointment_date, status, booking_source) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [appt.id, appt.clinicId, appt.patientId, appt.doctorId, appt.date, appt.status, ['App', 'Portal', 'Walk-in'][appt.id % 3]]
            );
        }
        console.log('Inserted 600 appointments.');

        // 7. Insert Prescriptions for Completed Appointments with realistic treemap diagnoses
        const diagnosesDistribution = [
            { name: 'Acne', count: 42 },
            { name: 'Depression', count: 35 },
            { name: 'Migraine', count: 32 },
            { name: 'Arrhythmia', count: 28 },
            { name: 'Common Cold', count: 25 },
            { name: 'Insomnia', count: 24 },
            { name: 'Meningitis', count: 22 },
            { name: 'Nerve Damage', count: 20 },
            { name: 'Sinusitis', count: 18 },
            { name: 'Fracture', count: 17 },
            { name: 'Coronary Artery Disease', count: 16 },
            { name: 'Fatigue', count: 15 },
            { name: 'Pregnancy Checkup', count: 14 },
            { name: 'Arthritis', count: 13 },
            { name: 'Epilepsy', count: 12 },
            { name: 'Hearing Loss', count: 11 },
            { name: 'Tonsillitis', count: 10 },
            { name: 'PCOS', count: 9 },
            { name: 'Glaucoma', count: 8 },
            { name: 'Skin Infection', count: 7 },
            { name: 'Stress', count: 6 },
            { name: 'Sports Injury', count: 5 },
            { name: 'Routine Checkup', count: 5 },
            { name: 'Infertility Consultation', count: 4 },
            { name: 'Stroke Follow-up', count: 4 },
            { name: 'Diabetes', count: 4 },
            { name: 'Vision Check', count: 3 },
            { name: 'Eczema', count: 3 },
            { name: 'Conjunctivitis', count: 2 },
            { name: 'Growth Checkup', count: 2 },
            { name: 'Vaccination', count: 2 },
            { name: 'Anxiety', count: 1 },
            { name: 'Hypertension', count: 1 },
            { name: 'Fever', count: 1 },
            { name: 'Ear Infection', count: 1 }
        ];

        // Create a flat array of diagnoses matching the distribution counts
        let flatDiagnoses = [];
        diagnosesDistribution.forEach(diag => {
            for (let c = 0; c < diag.count; c++) {
                flatDiagnoses.push(diag.name);
            }
        });

        // Shuffle diagnoses
        for (let i = flatDiagnoses.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flatDiagnoses[i], flatDiagnoses[j]] = [flatDiagnoses[j], flatDiagnoses[i]];
        }

        const completedAppts = appointmentsList.filter(a => a.status === 'Completed');
        console.log(`Matching ${completedAppts.length} completed appointments to prescriptions.`);

        let prescriptionId = 1;
        for (let i = 0; i < completedAppts.length; i++) {
            const appt = completedAppts[i];
            const diagnosis = flatDiagnoses[i % flatDiagnoses.length];

            await db.query(
                `INSERT INTO prescriptions (id, appointment_id, patient_id, doctor_id, diagnosis, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [prescriptionId, appt.id, appt.patientId, appt.doctorId, diagnosis, appt.date]
            );

            // Add a prescription item
            await db.query(
                `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES 
                 (?, 'Standard Medicine', '500mg', 'Once daily', '5 days', 'Take after meals')`,
                [prescriptionId]
            );

            prescriptionId++;
        }
        console.log(`Inserted ${prescriptionId - 1} prescriptions.`);

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ High-fidelity dashboard seeding completed successfully!');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await db.end();
    }
}

seed();
