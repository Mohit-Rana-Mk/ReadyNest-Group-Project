require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createSobhaClinic() {
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

    console.log('Connected to DB. Creating Sobha Clinic...');

    try {
        // Insert clinic
        const [clinicResult] = await db.query(`INSERT INTO clinics (name, license_number, address, city, postal_code, latitude, longitude, verification_status) VALUES 
            ('Sobha Medical Center', 'LIC-SOBHA01', '456 Wellness Blvd', 'Bangalore', '560001', 12.9716, 77.5946, 'Approved')
        `);
        
        const clinicId = clinicResult.insertId;
        console.log(`Created Clinic ID: ${clinicId}`);

        // Hash password
        const passwordHash = await bcrypt.hash('password123', 10);

        // Insert Admin User
        const [userResult] = await db.query(`INSERT INTO users (name, email, phone, password, role, status, clinic_id) VALUES 
            ('Sobha', 'sobha@healtrack.com', '9988776655', ?, 'ClinicAdmin', 'Active', ?)
        `, [passwordHash, clinicId]);

        console.log(`Created Admin User 'sobha' with ID: ${userResult.insertId} (email: sobha@healtrack.com, password: password123)`);
        
    } catch (error) {
        console.error('Error creating clinic/admin:', error);
    } finally {
        await db.end();
    }
}

createSobhaClinic();
