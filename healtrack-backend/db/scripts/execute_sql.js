const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });
    
    const sql = fs.readFileSync('../team_project.sql', 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    
    for (let stmt of statements) {
        await conn.query(stmt);
    }
    console.log("DB Recreated");
    process.exit(0);
}
run();
