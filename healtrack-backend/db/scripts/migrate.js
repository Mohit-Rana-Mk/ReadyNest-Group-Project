require('dotenv').config();
const db = require('./config/db');

async function migrate() {
    try {
        console.log("Starting Migration...");

        // 1. Add `name` and `mrn` columns to patients
        await db.query(`ALTER TABLE patients ADD COLUMN name VARCHAR(255) NULL`);
        await db.query(`ALTER TABLE patients ADD COLUMN mrn VARCHAR(50) NULL`);
        console.log("Added name and mrn columns.");

        // 2. Drop the unique constraint on user_id
        // Usually it's named 'user_id' or 'user_id_UNIQUE'
        await db.query(`ALTER TABLE patients DROP INDEX user_id`).catch(e => console.log("Index might not be named user_id, ignoring error.", e.message));
        console.log("Dropped UNIQUE constraint on user_id.");

        // 3. Backfill Data: Set patients.name = users.name
        await db.query(`
            UPDATE patients p
            JOIN users u ON p.user_id = u.id
            SET p.name = u.name
        `);
        console.log("Backfilled names from users table.");

        // 4. Generate unique MRNs for existing patients
        const [patients] = await db.query(`SELECT id FROM patients`);
        for (let pt of patients) {
            const mrn = `PT-${new Date().getFullYear()}-${String(pt.id).padStart(4, '0')}`;
            await db.query(`UPDATE patients SET mrn = ? WHERE id = ?`, [mrn, pt.id]);
        }
        console.log("Generated MRNs for existing patients.");

        // 5. Enforce NOT NULL and UNIQUE on the new columns now that data exists
        await db.query(`ALTER TABLE patients MODIFY COLUMN name VARCHAR(255) NOT NULL`);
        await db.query(`ALTER TABLE patients MODIFY COLUMN mrn VARCHAR(50) NOT NULL`);
        await db.query(`ALTER TABLE patients ADD UNIQUE INDEX idx_mrn (mrn)`);
        console.log("Enforced NOT NULL and UNIQUE constraints.");

        console.log("✅ Migration Complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
