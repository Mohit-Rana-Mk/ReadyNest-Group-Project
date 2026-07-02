const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const db = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
    const [users] = await db.query('SELECT email, password, status, role FROM users');
    for (const u of users) {
        const isMatch = await bcrypt.compare('password123', u.password);
        console.log(`${u.email}: match=${isMatch}, status=${u.status}, role=${u.role}`);
    }
    db.end();
}
run();
