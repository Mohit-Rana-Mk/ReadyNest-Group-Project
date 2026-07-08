const db = require('../../config/db');

async function migrate() {
    try {
        console.log("Creating clinic_outbreaks table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS clinic_outbreaks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clinic_id INT NOT NULL,
                disease VARCHAR(255) NOT NULL,
                sector VARCHAR(255) NOT NULL,
                severity ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                message TEXT NOT NULL,
                status ENUM('Active', 'Monitored', 'Resolved') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("clinic_outbreaks table created successfully.");

        // Check if there are any clinics to seed default outbreaks for
        const [clinics] = await db.query("SELECT id FROM clinics LIMIT 1");
        if (clinics.length > 0) {
            const clinicId = clinics[0].id;
            // Check if clinic_outbreaks is empty
            const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM clinic_outbreaks");
            if (count === 0) {
                console.log("Seeding default outbreaks for clinic ID:", clinicId);
                await db.query(`
                    INSERT INTO clinic_outbreaks (clinic_id, disease, sector, severity, message, status, created_at)
                    VALUES 
                    (?, 'Dengue Fever', 'Sector 4 & 5', 'High', 'High number of dengue cases reported. Please use mosquito nets and repellents.', 'Active', '2026-07-04'),
                    (?, 'Influenza A', 'Sector 12', 'Medium', 'Influenza A cases rising. Wear masks in crowded spaces.', 'Active', '2026-07-02'),
                    (?, 'Gastroenteritis', 'Sector 2', 'Low', 'Water contamination suspected in sector 2. Boil drinking water.', 'Monitored', '2026-06-28')
                `, [clinicId, clinicId, clinicId]);
                console.log("Default outbreaks seeded.");
            }
        }

        console.log("Migration complete.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
