require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function reset() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
    });

    console.log('Connected. Starting full reset...');

    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'payment_audit_logs',
            'refund_requests',
            'settlement_records',
            'payments',
            'razorpay_orders',
            'clinic_bank_accounts',
            'ai_triage_logs',
            'preventive_recommendations',
            'clinic_reviews',
            'patient_vitals',
            'prescription_items',
            'prescriptions',
            'appointments',
            'patients',
            'doctor_schedules',
            'clinic_services',
            'services',
            'clinics',
            'users'
        ];

        for (const table of tables) {
            await db.query(`TRUNCATE TABLE ${table}`);
            console.log(`  ✓ Truncated: ${table}`);
        }

        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        // Re-insert only SuperAdmin
        const passwordHash = await bcrypt.hash('password123', 10);
        await db.execute(
            `INSERT INTO users (id, name, email, phone, password, role, status, service_id, clinic_id)
             VALUES (1, 'Super Admin', 'superadmin@healtrack.com', '1000000001', ?, 'SuperAdmin', 'Active', NULL, NULL)`,
            [passwordHash]
        );

        console.log('\n✅ Reset complete. Only SuperAdmin remains.');
        console.log('   Email   : superadmin@healtrack.com');
        console.log('   Password: password123');
    } catch (err) {
        console.error('Reset error:', err);
    } finally {
        await db.end();
    }
}

reset();
