const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
    const db = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, multipleStatements: true });
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE users');
    await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('Patient', 'Doctor', 'SuperAdmin', 'ClinicAdmin', 'ClinicStaff') NOT NULL`);
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("Roles altered");
    db.end();
}
run();
