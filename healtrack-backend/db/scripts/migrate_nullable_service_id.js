/**
 * Migration: Make target_service_id nullable in preventive_recommendations
 *
 * Problem: The FK constraint on target_service_id required a valid services.id.
 * On fresh deployments (e.g. Render) where the services table is empty, outbreak
 * checks would fail with: "Cannot add or update a child row: a foreign key
 * constraint fails (preventive_recommendations, fk_2 FOREIGN KEY (target_service_id)
 * REFERENCES services (id) ON DELETE RESTRICT)"
 *
 * Fix: Allow target_service_id to be NULL so alerts can be created even when
 * no services are seeded yet.
 */
require('dotenv').config();
const db = require('../../config/db');

async function migrate() {
    try {
        console.log('Starting migration: make target_service_id nullable...');

        // Check current column definition
        const [cols] = await db.query(
            `SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_TYPE
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'preventive_recommendations'
               AND COLUMN_NAME = 'target_service_id'`
        );

        if (cols.length === 0) {
            console.log('Column target_service_id not found. Check table name.');
            process.exit(1);
        }

        const col = cols[0];
        console.log('Current column definition:', col);

        if (col.IS_NULLABLE === 'YES') {
            console.log('✅ target_service_id is already nullable. No migration needed.');
            process.exit(0);
        }

        // Drop the FK constraint first (find its name)
        const [fks] = await db.query(
            `SELECT CONSTRAINT_NAME
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'preventive_recommendations'
               AND COLUMN_NAME = 'target_service_id'
               AND REFERENCED_TABLE_NAME = 'services'`
        );

        for (const fk of fks) {
            console.log(`Dropping FK constraint: ${fk.CONSTRAINT_NAME}`);
            await db.query(
                `ALTER TABLE preventive_recommendations DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``
            );
        }

        // Alter column to be nullable
        console.log('Altering column to be nullable...');
        await db.query(
            `ALTER TABLE preventive_recommendations
             MODIFY COLUMN target_service_id INT NULL DEFAULT NULL`
        );

        // Re-add the FK constraint with NULL support
        console.log('Re-adding FK constraint...');
        await db.query(
            `ALTER TABLE preventive_recommendations
             ADD CONSTRAINT fk_preventive_rec_service
             FOREIGN KEY (target_service_id) REFERENCES services(id) ON DELETE SET NULL`
        );

        console.log('✅ Migration complete! target_service_id is now nullable.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
