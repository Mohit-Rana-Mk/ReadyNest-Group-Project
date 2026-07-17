require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fullReset() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
    });

    console.log('✅ Connected to database:', process.env.DB_NAME);
    console.log('⚠️  Starting full data reset — keeping only SuperAdmin...\n');

    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // All tables in dependency order (most dependent first)
        const tables = [
            // Pharmacy
            'pharmacy_audit_logs',
            'pharmacy_stock_logs',
            'pharmacy_bill_items',
            'pharmacy_bills',
            'pharmacy_medicines',
            // Payments
            'payment_audit_logs',
            'refund_requests',
            'razorpay_orders',
            'settlement_records',
            'payments',
            'clinic_bank_accounts',
            // Clinical
            'ai_triage_logs',
            'preventive_recommendations',
            'clinic_outbreaks',
            'clinic_reviews',
            'patient_vitals',
            'patient_reports',
            'notifications',
            'prescription_items',
            'prescriptions',
            'appointments',
            // Core entities
            'patients',
            'doctor_schedules',
            'clinic_services',
            'services',
            'clinics',
            'users'
        ];

        for (const table of tables) {
            try {
                await db.query(`DELETE FROM \`${table}\``);
                console.log(`  ✓ Cleared: ${table}`);
            } catch (err) {
                console.error(`  ✗ Failed to clear ${table}: ${err.message}`);
            }
        }

        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n🔐 Re-inserting SuperAdmin user...');

        // Re-insert SuperAdmin
        const passwordHash = await bcrypt.hash('password123', 10);
        await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status, service_id, clinic_id)
             VALUES ('Super Admin', 'superadmin@healtrack.com', '1000000001', ?, 'SuperAdmin', 'Active', NULL, NULL)`,
            [passwordHash]
        );

        // Verify
        const [adminRows] = await db.query("SELECT id, name, email, role, status FROM users WHERE role = 'SuperAdmin'");
        console.log('\n✅ Reset complete! Database now contains only:');
        console.table(adminRows);

        console.log('─────────────────────────────────────────');
        console.log('  Admin Login:');
        console.log('  Email   : superadmin@healtrack.com');
        console.log('  Password: password123');
        console.log('─────────────────────────────────────────');

    } catch (err) {
        console.error('\n❌ Reset failed:', err.message || err);
    } finally {
        await db.end();
        console.log('\nDatabase connection closed.');
    }
}

fullReset();
