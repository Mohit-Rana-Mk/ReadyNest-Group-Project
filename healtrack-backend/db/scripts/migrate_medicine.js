const db = require('../../config/db');

async function migrate() {
    try {
        console.log("Starting Medicine Portal Database Migration...");

        // 1. Alter users table to add 'Medicine' role if not already there
        console.log("Altering users table role ENUM...");
        await db.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('Patient', 'Doctor', 'SuperAdmin', 'ClinicAdmin', 'ClinicStaff', 'Medicine') NOT NULL
        `);
        console.log("Updated users table role ENUM.");

        // 2. Create pharmacy_medicines table
        console.log("Creating pharmacy_medicines table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS pharmacy_medicines (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created pharmacy_medicines table.");

        // 3. Create pharmacy_bills table
        console.log("Creating pharmacy_bills table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS pharmacy_bills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bill_number VARCHAR(100) NOT NULL UNIQUE,
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
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created pharmacy_bills table.");

        // 4. Create pharmacy_bill_items table
        console.log("Creating pharmacy_bill_items table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS pharmacy_bill_items (
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

        // 5. Create pharmacy_stock_logs table
        console.log("Creating pharmacy_stock_logs table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS pharmacy_stock_logs (
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

        // 6. Create pharmacy_audit_logs table
        console.log("Creating pharmacy_audit_logs table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS pharmacy_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_name VARCHAR(255) NOT NULL,
                role VARCHAR(100) NOT NULL,
                ip_address VARCHAR(50) NULL,
                action VARCHAR(255) NOT NULL,
                details TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created pharmacy_audit_logs table.");

        console.log("✅ Medicine Portal Database Migration Complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
