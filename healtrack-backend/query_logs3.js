require('dotenv').config();
const db = require('./config/db');

async function test() {
    try {
        const [rows] = await db.query('SHOW TABLES');
        console.log(rows.map(r => Object.values(r)[0]).join('\n'));
    } catch(err) {
        console.error("DB Error:", err.message);
    }
    process.exit(0);
}

test().catch(e => console.error(e));
