require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'team_project',
        ssl: process.env.DB_SSL === 'true' ? {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        } : undefined
    });

    console.log('Connected to DB. Seeding Pharmacy Module...');

    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Truncate existing pharmacy tables to avoid duplicate entries
        console.log('Truncating pharmacy tables...');
        await db.query('TRUNCATE TABLE pharmacy_stock_logs');
        await db.query('TRUNCATE TABLE pharmacy_bill_items');
        await db.query('TRUNCATE TABLE pharmacy_bills');
        await db.query('TRUNCATE TABLE pharmacy_medicines');

        // 2. Insert premium pharmacy medicines
        console.log('Inserting pharmacy inventory...');
        const medicines = [
            { clinic_id: 1, name: 'Paracetamol', generic: 'Paracetamol', brand: 'Crocin Advance', batch: 'B-PRC001', exp: '2027-08-15', cost: 12.50, sell: 25.00, qty: 150, min: 20, gst: 12.00, bar: '8901234001' },
            { clinic_id: 1, name: 'Amoxicillin 500mg', generic: 'Amoxicillin', brand: 'Novamox 500', batch: 'B-AMX002', exp: '2026-12-30', cost: 45.00, sell: 85.00, qty: 120, min: 15, gst: 12.00, bar: '8901234002' },
            { clinic_id: 1, name: 'Cetirizine 10mg', generic: 'Cetirizine Hydrochloride', brand: 'Cetzine', batch: 'B-CTZ003', exp: '2028-02-18', cost: 8.00, sell: 18.50, qty: 200, min: 25, gst: 12.00, bar: '8901234003' },
            { clinic_id: 1, name: 'Ibuprofen 400mg', generic: 'Ibuprofen', brand: 'Brufen 400', batch: 'B-IBP004', exp: '2026-10-05', cost: 15.00, sell: 32.00, qty: 8, min: 10, gst: 12.00, bar: '8901234004' }, // low stock
            { clinic_id: 1, name: 'Atorvastatin 10mg', generic: 'Atorvastatin', brand: 'Lipivas 10', batch: 'B-ATV005', exp: '2026-08-01', cost: 65.00, sell: 110.00, qty: 90, min: 12, gst: 12.00, bar: '8901234005' }, // expiring soon
            { clinic_id: 1, name: 'Metformin 500mg', generic: 'Metformin Hydrochloride', brand: 'Glycomet 500', batch: 'B-MET006', exp: '2027-11-20', cost: 18.00, sell: 38.00, qty: 300, min: 30, gst: 12.00, bar: '8901234006' },
            { clinic_id: 1, name: 'Pantoprazole 40mg', generic: 'Pantoprazole Sodium', brand: 'Pan 40', batch: 'B-PNT007', exp: '2028-06-10', cost: 35.00, sell: 70.00, qty: 180, min: 20, gst: 12.00, bar: '8901234007' },
            { clinic_id: 1, name: 'Azithromycin 500mg', generic: 'Azithromycin', brand: 'Azee 500', batch: 'B-AZI008', exp: '2026-07-28', cost: 55.00, sell: 120.00, qty: 50, min: 10, gst: 12.00, bar: '8901234008' } // expiring very soon
        ];

        for (let med of medicines) {
            await db.query(
                `INSERT INTO pharmacy_medicines 
                 (clinic_id, medicine_name, generic_name, brand, batch_number, expiry_date, purchase_price, selling_price, available_quantity, min_stock_alert, supplier_details, gst_percent, barcode)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [med.clinic_id, med.name, med.generic, med.brand, med.batch, med.exp, med.cost, med.sell, med.qty, med.min, 'General Distributors Ltd.', med.gst, med.bar]
            );
        }
        console.log('Inserted pharmacy medicines.');

        // 3. Backfill prescription items with real medicine names
        console.log('Updating prescription items...');
        await db.query('TRUNCATE TABLE prescription_items');

        const [prescriptions] = await db.query('SELECT id FROM prescriptions LIMIT 50');
        const medNames = ['Paracetamol', 'Amoxicillin 500mg', 'Cetirizine 10mg', 'Ibuprofen 400mg', 'Pantoprazole 40mg'];

        for (let i = 0; i < prescriptions.length; i++) {
            const prescId = prescriptions[i].id;
            const med1 = medNames[i % medNames.length];
            const med2 = medNames[(i + 1) % medNames.length];

            await db.query(
                `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES 
                 (?, ?, '1 tablet', 'Twice daily', '5 days', 'Take with warm water'),
                 (?, ?, '1 capsule', 'Once daily', '7 days', 'Before breakfast')`,
                [prescId, med1, prescId, med2]
            );
        }
        console.log(`Updated items for ${prescriptions.length} prescriptions.`);

        // 4. Seed some initial bills
        console.log('Seeding initial bills...');
        const billQuery1 = `
            INSERT INTO pharmacy_bills 
            (bill_number, clinic_id, prescription_id, patient_id, doctor_id, patient_name, doctor_name, subtotal, gst_amount, discount_amount, grand_total, payment_method, payment_status, receipt_number, created_at)
            VALUES
            ('PHM-171800100', 1, 1, 1, 2, 'Patient One', 'Dr. Vivek Nair', 110.00, 13.20, 10.00, 113.20, 'Cash', 'Paid', 'REC-PHM-171800100', DATE_SUB(NOW(), INTERVAL 2 DAY)),
            ('PHM-171800101', 1, 2, 2, 3, 'Patient Two', 'Dr. Shalini Desai', 205.00, 24.60, 0.00, 229.60, 'Online', 'Paid', 'REC-PHM-171800101', DATE_SUB(NOW(), INTERVAL 1 DAY)),
            ('PHM-171800102', 1, NULL, 1, 4, 'Patient One', 'Dr. Ritu Sharma', 70.00, 8.40, 5.00, 73.40, 'Cash', 'Paid', 'REC-PHM-171800102', NOW())
        `;
        await db.query(billQuery1);

        // Fetch generated bill IDs to insert items
        const [[bill1]] = await db.query("SELECT id FROM pharmacy_bills WHERE bill_number = 'PHM-171800100'");
        const [[bill2]] = await db.query("SELECT id FROM pharmacy_bills WHERE bill_number = 'PHM-171800101'");
        const [[bill3]] = await db.query("SELECT id FROM pharmacy_bills WHERE bill_number = 'PHM-171800102'");

        // Get medicine IDs
        const [[med1]] = await db.query("SELECT id FROM pharmacy_medicines WHERE medicine_name = 'Paracetamol'");
        const [[med2]] = await db.query("SELECT id FROM pharmacy_medicines WHERE medicine_name = 'Novamox 500' OR medicine_name = 'Amoxicillin 500mg'");
        const [[med3]] = await db.query("SELECT id FROM pharmacy_medicines WHERE medicine_name = 'Pantoprazole 40mg'");

        if (bill1 && med1 && med2) {
            await db.query(`INSERT INTO pharmacy_bill_items (bill_id, medicine_id, medicine_name, quantity, unit_price, total_price) VALUES
                (?, ?, 'Paracetamol', 2, 25.00, 50.00),
                (?, ?, 'Amoxicillin 500mg', 1, 85.00, 85.00)`,
                [bill1.id, med1.id, bill1.id, med2.id]
            );
        }

        if (bill2 && med2 && med3) {
            await db.query(`INSERT INTO pharmacy_bill_items (bill_id, medicine_id, medicine_name, quantity, unit_price, total_price) VALUES
                (?, ?, 'Amoxicillin 500mg', 2, 85.00, 170.00),
                (?, ?, 'Pantoprazole 40mg', 1, 70.00, 70.00)`,
                [bill2.id, med2.id, bill2.id, med3.id]
            );
        }

        if (bill3 && med3) {
            await db.query(`INSERT INTO pharmacy_bill_items (bill_id, medicine_id, medicine_name, quantity, unit_price, total_price) VALUES
                (?, ?, 'Pantoprazole 40mg', 1, 70.00, 70.00)`,
                [bill3.id, med3.id]
            );
        }

        // Add some audit logs
        console.log('Seeding pharmacy audit logs...');
        await db.query(`INSERT INTO pharmacy_audit_logs (user_name, role, ip_address, action, details) VALUES
            ('Rahul Verma', 'ClinicStaff', '127.0.0.1', 'ADD_MEDICINE', '{"medicine_name":"Paracetamol","qty":150}'),
            ('Rahul Verma', 'ClinicStaff', '127.0.0.1', 'DISPENSE_BILL', '{"bill_number":"PHM-171800100","total":113.20}')
        `);

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Pharmacy module seeded successfully!');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await db.end();
    }
}

seed();
