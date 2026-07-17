const db = require('../../config/db');

async function migrate() {
    try {
        console.log("Starting Medicine Portal Database Migration v2...");

        // Drop tables first due to FK constraints
        console.log("Dropping existing pharmacy bill tables...");
        await db.query(`DROP TABLE IF EXISTS pharmacy_bill_items`);
        await db.query(`DROP TABLE IF EXISTS pharmacy_bills`);
        console.log("Dropped tables.");

        // Re-create pharmacy_bills with clinic_id
        console.log("Re-creating pharmacy_bills with clinic_id...");
        await db.query(`
            CREATE TABLE pharmacy_bills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bill_number VARCHAR(100) NOT NULL UNIQUE,
                clinic_id INT NOT NULL,
                prescription_id INT NULL,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                patient_name VARCHAR(255) NOT NULL,
                doctor_name VARCHAR(255) NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                gst_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                grand_total DECIMAL(10, 2) NOT NULL,
                payment_method ENUM('Cash', 'Online') NULL,
                payment_status ENUM('Pending', 'Paid', 'Failed', 'Refunded') DEFAULT 'Pending',
                razorpay_order_id VARCHAR(255) NULL,
                razorpay_payment_id VARCHAR(255) NULL,
                razorpay_signature VARCHAR(255) NULL,
                receipt_number VARCHAR(100) NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created pharmacy_bills table.");

        // Re-create pharmacy_bill_items
        console.log("Re-creating pharmacy_bill_items...");
        await db.query(`
            CREATE TABLE pharmacy_bill_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bill_id INT NOT NULL,
                medicine_id INT NOT NULL,
                medicine_name VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (bill_id) REFERENCES pharmacy_bills(id) ON DELETE CASCADE,
                FOREIGN KEY (medicine_id) REFERENCES pharmacy_medicines(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created pharmacy_bill_items table.");

        console.log("✅ Medicine Portal Database Migration v2 Complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
