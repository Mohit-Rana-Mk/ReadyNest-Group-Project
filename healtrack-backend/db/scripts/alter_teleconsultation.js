const db = require('../../config/db');

async function alterAppointments() {
    try {
        console.log('Adding consultation_type and meeting_link to appointments table...');
        
        await db.query(`
            ALTER TABLE appointments 
            ADD COLUMN consultation_type ENUM('In-Person', 'Teleconsultation') DEFAULT 'In-Person',
            ADD COLUMN meeting_link VARCHAR(255) DEFAULT NULL
        `);
        
        console.log('Successfully added teleconsultation columns.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist. Skipping.');
            process.exit(0);
        } else {
            console.error('Error altering table:', error);
            process.exit(1);
        }
    }
}

alterAppointments();
