require('dotenv').config();
const db = require('./config/db');

async function test() {
    const [rows] = await db.query('SELECT user_input, predicted_risk FROM ai_triage_logs ORDER BY created_at DESC LIMIT 10');
    console.log(rows);
    process.exit(0);
}

test().catch(e => console.error(e));
