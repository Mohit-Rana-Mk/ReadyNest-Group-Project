const db = require('./config/db');

async function truncateDatabase() {
    try {
        console.log('Disabling foreign key checks...');
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('Truncating tables...');
        const tablesToTruncate = [
            'ai_triage_logs',
            'appointments',
            'clinic_reviews',
            'clinic_services',
            'clinics',
            'doctor_schedules',
            'notifications',
            'patient_reports',
            'patient_vitals',
            'patients',
            'prescription_items',
            'prescriptions',
            'preventive_recommendations',
            'services'
        ];

        for (const table of tablesToTruncate) {
            await db.query(`TRUNCATE TABLE ${table}`);
            console.log(`Truncated ${table}`);
        }

        console.log('Deleting non-SuperAdmin users...');
        await db.query(`DELETE FROM users WHERE role != 'SuperAdmin'`);
        console.log('Deleted non-SuperAdmin users.');

        console.log('Enabling foreign key checks...');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Database truncated successfully (SuperAdmin preserved).');
        process.exit(0);
    } catch (error) {
        console.error('Error truncating database:', error);
        process.exit(1);
    }
}

truncateDatabase();
