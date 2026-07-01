const fs = require('fs');
require('dotenv').config();
const db = require('./config/db');

async function runSeed() {
    try {
        const sql = fs.readFileSync('../mock_ml_data.sql', 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
        
        for (let stmt of statements) {
            await db.query(stmt);
        }
        
        console.log("Mock ML Data inserted successfully.");
    } catch (err) {
        console.error("Error inserting Mock ML Data:", err);
    } finally {
        process.exit();
    }
}
runSeed();
