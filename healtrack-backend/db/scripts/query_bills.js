const db = require('../../config/db');

async function run() {
    try {
        const [doctors] = await db.query(
            "SELECT id, name, role, clinic_id FROM users WHERE role = 'Doctor' LIMIT 5"
        );
        console.log('Doctors:');
        console.log(doctors);

        const [patients] = await db.query(
            "SELECT id, name, mrn, user_id FROM patients LIMIT 5"
        );
        console.log('Patients:');
        console.log(patients);

        const [appointments] = await db.query(
            "SELECT id, patient_id, doctor_id, clinic_id FROM appointments LIMIT 5"
        );
        console.log('Appointments:');
        console.log(appointments);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
