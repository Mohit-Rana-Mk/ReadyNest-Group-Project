const db = require('./config/db');

async function test() {
    const [users] = await db.query(`
        SELECT u.*, 
               c.name as clinic_name,
               c.id as resolved_clinic_id
        FROM users u
        LEFT JOIN clinics c ON u.clinic_id = c.id
        WHERE u.email = ?
    `, ['admin@healtrack.com']);
    console.log(users[0]);
    
    const [doctors] = await db.query(`
        SELECT u.*, 
               c.name as clinic_name,
               c.id as resolved_clinic_id
        FROM users u
        LEFT JOIN doctor_schedules ds ON ds.doctor_id = u.id
        LEFT JOIN clinics c ON ds.clinic_id = c.id
        WHERE u.email = ?
    `, ['vikram@healtrack.com']);
    console.log(doctors[0]);
    process.exit(0);
}
test();
