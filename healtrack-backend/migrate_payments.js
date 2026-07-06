require('dotenv').config();
const db = require('./config/db');

async function migrate() {
    try {
        console.log("Starting Payments & Settlements Database Migration...");

        // 1. Alter appointments table status column
        console.log("Altering appointments table status ENUM...");
        await db.query(`
            ALTER TABLE appointments 
            MODIFY COLUMN status ENUM('Pending Payment', 'Confirmed', 'Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled') 
            DEFAULT 'Pending Payment'
        `);
        console.log("Updated appointments table status column.");

        // 2. Create clinic_bank_accounts table
        console.log("Creating clinic_bank_accounts table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS clinic_bank_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clinic_id INT NOT NULL UNIQUE,
                account_holder_name VARCHAR(255) NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                account_number VARCHAR(100) NOT NULL,
                ifsc_code VARCHAR(20) NOT NULL,
                branch_name VARCHAR(255) NULL,
                upi_id VARCHAR(100) NULL,
                proof_url VARCHAR(255) NULL,
                status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created clinic_bank_accounts table.");

        // 3. Create razorpay_orders table
        console.log("Creating razorpay_orders table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS razorpay_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                appointment_id INT NOT NULL,
                order_id VARCHAR(100) NOT NULL UNIQUE,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                status VARCHAR(50) NOT NULL DEFAULT 'created',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created razorpay_orders table.");

        // 4. Create payments table
        console.log("Creating payments table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                clinic_id INT NOT NULL,
                appointment_id INT NOT NULL UNIQUE,
                razorpay_order_id VARCHAR(100) NOT NULL,
                razorpay_payment_id VARCHAR(100) NULL,
                razorpay_signature VARCHAR(255) NULL,
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('Pending', 'Paid', 'Failed', 'Refunded') DEFAULT 'Pending',
                receipt_id VARCHAR(100) NOT NULL UNIQUE,
                invoice_id VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created payments table.");

        // 5. Create settlement_records table
        console.log("Creating settlement_records table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS settlement_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clinic_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                settlement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reference_number VARCHAR(100) NOT NULL,
                remarks TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created settlement_records table.");

        // 6. Create refund_requests table
        console.log("Creating refund_requests table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS refund_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                reason TEXT NOT NULL,
                status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created refund_requests table.");

        // 7. Create payment_audit_logs table
        console.log("Creating payment_audit_logs table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS payment_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                action VARCHAR(255) NOT NULL,
                details TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created payment_audit_logs table.");

        console.log("✅ Payments & Settlements Database Migration Complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
