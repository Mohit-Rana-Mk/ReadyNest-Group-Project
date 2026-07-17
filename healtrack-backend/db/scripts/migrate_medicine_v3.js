const db = require('../../config/db');

async function migrate() {
    try {
        console.log("Starting Medicine Portal Database Migration v3...");

        // Drop tables first due to FK constraints
        console.log("Dropping existing pharmacy tables...");
        await db.query(`DROP TABLE IF EXISTS pharmacy_stock_logs`);
        await db.query(`DROP TABLE IF EXISTS pharmacy_bill_items`);
        await db.query(`DROP TABLE IF EXISTS pharmacy_bills`);
        await db.query(`DROP TABLE IF EXISTS pharmacy_medicines`);
        console.log("Dropped tables.");

        // Re-create pharmacy_medicines with clinic_id
        console.log("Re-creating pharmacy_medicines with clinic_id...");
        await db.query(`
            CREATE TABLE pharmacy_medicines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clinic_id INT NOT NULL,
                medicine_name VARCHAR(255) NOT NULL,
                generic_name VARCHAR(255) NOT NULL,
                brand VARCHAR(255) NOT NULL,
                batch_number VARCHAR(100) NOT NULL,
                expiry_date DATE NOT NULL,
                purchase_price DECIMAL(10, 2) NOT NULL,
                selling_price DECIMAL(10, 2) NOT NULL,
                available_quantity INT NOT NULL DEFAULT 0,
                min_stock_alert INT NOT NULL DEFAULT 10,
                supplier_details TEXT NULL,
                gst_percent DECIMAL(5,2) DEFAULT 0.00,
                barcode VARCHAR(100) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created pharmacy_medicines table.");

        // Re-create pharmacy_bills
        console.log("Re-creating pharmacy_bills...");
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

        // Re-create pharmacy_stock_logs
        console.log("Re-creating pharmacy_stock_logs...");
        await db.query(`
            CREATE TABLE pharmacy_stock_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                medicine_id INT NOT NULL,
                user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL, -- 'Added', 'Updated', 'Deleted', 'Increased', 'Decreased', 'Dispensed'
                quantity INT NOT NULL,
                details VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medicine_id) REFERENCES pharmacy_medicines(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created pharmacy_stock_logs table.");

        console.log("✅ Medicine Portal Database Migration v3 Complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
