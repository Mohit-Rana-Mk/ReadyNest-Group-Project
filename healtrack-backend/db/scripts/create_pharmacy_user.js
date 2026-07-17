require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createUser() {
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

    console.log('Connected to DB. Creating Medicine user...');

    try {
        const passwordHash = await bcrypt.hash('password123', 10);
        
        // Check if user exists
        const [existing] = await db.query("SELECT id FROM users WHERE email = 'pharmacy@healtrack.com'");
        if (existing.length > 0) {
            console.log('User pharmacy@healtrack.com already exists. Updating password...');
            await db.query("UPDATE users SET password = ?, role = 'Medicine', name = 'Pharmacy Staff', clinic_id = 1 WHERE email = 'pharmacy@healtrack.com'", [passwordHash]);
        } else {
            console.log('Inserting user pharmacy@healtrack.com...');
            await db.query(
                `INSERT INTO users (name, email, phone, password, role, status, clinic_id) 
                 VALUES ('Pharmacy Staff', 'pharmacy@healtrack.com', '1000000088', ?, 'Medicine', 'Active', 1)`,
                [passwordHash]
            );
        }
        console.log('✅ User pharmacy@healtrack.com created successfully with password123!');
    } catch (err) {
        console.error('Error creating user:', err);
    } finally {
        await db.end();
    }
}

createUser();
