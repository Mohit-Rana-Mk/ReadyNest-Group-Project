require('dotenv').config();
const db = require('../../config/db');

async function migrate() {
    try {
        console.log("Starting Language Migration...");

        // Add `language` column to users if it doesn't exist
        const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'language'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE users ADD COLUMN language VARCHAR(5) DEFAULT 'en'");
            console.log("Added language column to users table.");
        } else {
            console.log("language column already exists on users table.");
        }

        console.log("✅ Language Migration Complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
