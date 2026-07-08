const db = require('../../config/db');
async function run() {
    const [rows] = await db.query("SELECT name, email FROM users WHERE role='Patient' LIMIT 5");
    console.log(rows);
    process.exit(0);
}
run();
