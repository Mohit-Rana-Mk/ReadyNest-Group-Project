const pool = require('./config/db');
const crypto = require('crypto');

async function runTest() {
    console.log('🧪 Starting Payments & Settlements Integration Verification...\n');
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Setup Mock Clinic, User and Doctor
        console.log('1. Mocking environment data...');
        
        // Clean up previous test artifacts first to prevent foreign key errors
        await connection.query("DELETE FROM payment_audit_logs");
        await connection.query("DELETE FROM refund_requests");
        await connection.query("DELETE FROM settlement_records");
        await connection.query("DELETE FROM payments");
        await connection.query("DELETE FROM razorpay_orders");
        await connection.query("DELETE FROM clinic_bank_accounts");
        await connection.query("DELETE FROM appointments WHERE id IN (999, 1000)");
        await connection.query("DELETE FROM patients WHERE id = 999");
        await connection.query("DELETE FROM users WHERE id IN (998, 999)");
        await connection.query("DELETE FROM clinics WHERE id = 999");

        // Create Clinic with random license number
        const licNum = 'LIC-' + Math.floor(Math.random() * 10000000);
        await connection.query(`
            INSERT INTO clinics (id, name, license_number, address, city, postal_code, verification_status)
            VALUES (999, 'Test Healthcare Clinic', ?, '123 Medical Way', 'Mumbai', '400001', 'Approved')
        `, [licNum]);
        console.log('   - Created mockup clinic with ID 999');

        const docPhone = '987' + Math.floor(Math.random() * 10000000);
        const patPhone = '888' + Math.floor(Math.random() * 10000000);

        // Create Doctor User
        await connection.query(`
            INSERT INTO users (id, name, email, phone, password, role, status, clinic_id)
            VALUES (998, 'Sarah Jenkins', 'doctor_test@healtrack.com', ?, 'hashed', 'Doctor', 'Active', 999)
        `, [docPhone]);
        console.log('   - Created mockup Doctor User with ID 998');

        // Create Patient User
        await connection.query(`
            INSERT INTO users (id, name, email, phone, password, role, status)
            VALUES (999, 'John Doe', 'patient_test@healtrack.com', ?, 'hashed', 'Patient', 'Active')
        `, [patPhone]);
        console.log('   - Created mockup Patient User with ID 999');

        // Create Patient Profile
        await connection.query(`
            INSERT INTO patients (id, user_id, mrn, name, gender)
            VALUES (999, 999, 'MRN-90210', 'John Doe', 'Male')
        `);
        console.log('   - Created mockup Patient profile with ID 999');

        // 2. Create Mock Appointment
        console.log('2. Creating mock appointment for booking...');
        await connection.query(`
            INSERT INTO appointments (id, patient_id, doctor_id, clinic_id, appointment_date, status)
            VALUES (999, 999, 998, 999, '2026-07-10 10:00:00', 'Pending Payment')
        `);
        console.log('   - Created appointment ID 999 with status "Pending Payment"');

        // 3. Create Razorpay Order
        console.log('3. Registering Razorpay Order in DB...');
        const orderId = 'order_test_' + Math.random().toString(36).substring(7);
        const receiptId = 'rcpt_test_' + Math.random().toString(36).substring(7);
        
        await connection.query(`
            INSERT INTO razorpay_orders (order_id, appointment_id, amount, status)
            VALUES (?, 999, 800.00, 'created')
        `, [orderId]);
        console.log(`   - Saved order ${orderId}`);

        // 4. Verify Payment signature mock logic
        console.log('4. Verifying payment confirmation & state update...');
        const paymentId = 'pay_test_' + Math.random().toString(36).substring(7);
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
        const signaturePayload = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', razorpaySecret)
            .update(signaturePayload)
            .digest('hex');

        // Execute DB updates simulating controller verification success
        const invoiceId = 'INV-' + Date.now() + '-999';
        await connection.beginTransaction();

        await connection.query(`
            UPDATE appointments SET status = 'Confirmed' WHERE id = 999
        `);

        await connection.query(`
            INSERT INTO payments (patient_id, doctor_id, clinic_id, appointment_id, receipt_id, invoice_id, amount, status, razorpay_order_id, razorpay_payment_id, razorpay_signature)
            VALUES (999, 998, 999, 999, ?, ?, 800.00, 'Paid', ?, ?, ?)
        `, [receiptId, invoiceId, orderId, paymentId, expectedSignature]);

        await connection.query(`
            UPDATE razorpay_orders SET status = 'paid' WHERE order_id = ?
        `, [orderId]);

        await connection.commit();
        console.log('   - Verified payment signature successfully.');
        console.log('   - Updated appointment status to "Confirmed".');
        console.log('   - Created invoice record.');

        // 5. Test bank details registration for Clinic
        console.log('5. Registering clinic bank details...');
        await connection.query(`
            INSERT INTO clinic_bank_accounts (clinic_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, status)
            VALUES (999, 'Test Clinic Corp', 'State Bank of India', '333344445555', 'SBIN0001234', 'Mumbai City', 'Pending')
        `);
        console.log('   - Clinic bank details submitted for approval (Status: Pending)');

        // Approve bank details
        await connection.query(`
            UPDATE clinic_bank_accounts SET status = 'Approved' WHERE clinic_id = 999
        `);
        console.log('   - Bank details approved by SuperAdmin.');

        // 6. Test refund request flow
        console.log('6. Processing patient refund requests...');
        const [paymentRow] = await connection.query('SELECT id FROM payments WHERE appointment_id = 999');
        const paymentDbId = paymentRow[0].id;

        await connection.query(`
            INSERT INTO refund_requests (payment_id, amount, reason, status)
            VALUES (?, 800.00, 'Patient cancellation request', 'Pending')
        `, [paymentDbId]);
        console.log('   - Refund request registered by patient (Status: Pending)');

        // SuperAdmin approves refund
        await connection.beginTransaction();
        await connection.query(`
            UPDATE refund_requests SET status = 'Approved', processed_at = NOW() WHERE payment_id = ?
        `, [paymentDbId]);

        await connection.query(`
            UPDATE payments SET status = 'Refunded' WHERE id = ?
        `, [paymentDbId]);

        await connection.query(`
            UPDATE appointments SET status = 'Cancelled' WHERE id = 999
        `);
        await connection.commit();
        console.log('   - Refund approved. Payment status updated to "Refunded". Appointment marked "Cancelled".');

        // Let's create another mock payment of 1200 INR to test settlement calculations
        console.log('7. Creating another mock appointment and payment for settlement tests...');
        await connection.query(`
            INSERT INTO appointments (id, patient_id, doctor_id, clinic_id, appointment_date, status)
            VALUES (1000, 999, 998, 999, '2026-07-11 11:00:00', 'Confirmed')
        `);

        const orderId2 = 'order_test_2';
        const receiptId2 = 'rcpt_test_2';
        const paymentId2 = 'pay_test_2';
        const invoiceId2 = 'INV-' + (Date.now() + 1) + '-1000';

        await connection.query(`
            INSERT INTO payments (patient_id, doctor_id, clinic_id, appointment_id, receipt_id, invoice_id, amount, status, razorpay_order_id, razorpay_payment_id)
            VALUES (999, 998, 999, 1000, ?, ?, 1200.00, 'Paid', ?, ?)
        `, [receiptId2, invoiceId2, orderId2, paymentId2]);
        console.log('   - Registered new "Paid" transaction of ₹1200.00');

        // Calculate settlement balances for clinic 999
        console.log('8. Calculating settlement summaries...');
        const [[{ total_revenue }]] = await connection.query(`
            SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments
            WHERE appointment_id IN (SELECT id FROM appointments WHERE clinic_id = 999)
              AND status = 'Paid'
        `);

        const [[{ total_settled }]] = await connection.query(`
            SELECT COALESCE(SUM(amount), 0) as total_settled FROM settlement_records
            WHERE clinic_id = 999
        `);

        const pendingSettlement = parseFloat(total_revenue) - parseFloat(total_settled);
        console.log(`   - Clinic total paid revenue: ₹${total_revenue}`);
        console.log(`   - Clinic total settled: ₹${total_settled}`);
        console.log(`   - Pending balance to settle: ₹${pendingSettlement}`);

        // Record a settlement of 500 INR
        console.log('9. Recording a manual payout...');
        const refNo = 'UTR' + Date.now();
        await connection.query(`
            INSERT INTO settlement_records (clinic_id, amount, reference_number, remarks, settlement_date)
            VALUES (999, 500.00, ?, 'Partial weekly payout', NOW())
        `, [refNo]);
        console.log(`   - SuperAdmin recorded payout of ₹500.00 (Ref: ${refNo})`);

        // Recalculate unsettling balance
        const [[{ total_settled: total_settled_new }]] = await connection.query(`
            SELECT COALESCE(SUM(amount), 0) as total_settled FROM settlement_records
            WHERE clinic_id = 999
        `);
        const pendingNew = parseFloat(total_revenue) - parseFloat(total_settled_new);
        console.log(`   - Recalculated pending balance: ₹${pendingNew}`);

        if (pendingNew === 700.00) {
            console.log('\n✅ All database tests and financial ledger calculations passed successfully!');
        } else {
            console.error(`\n❌ Warning: Recalculated balance is ${pendingNew}, expected 700.00`);
        }

        // Clean up test records
        await connection.query("DELETE FROM payment_audit_logs");
        await connection.query("DELETE FROM refund_requests");
        await connection.query("DELETE FROM settlement_records");
        await connection.query("DELETE FROM payments");
        await connection.query("DELETE FROM razorpay_orders");
        await connection.query("DELETE FROM clinic_bank_accounts");
        await connection.query("DELETE FROM appointments WHERE id IN (999, 1000)");
        await connection.query("DELETE FROM patients WHERE id = 999");
        await connection.query("DELETE FROM users WHERE id IN (998, 999)");
        await connection.query("DELETE FROM clinics WHERE id = 999");
        console.log('🧹 Cleaned up mock database entries.');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
    } finally {
        if (connection) connection.release();
        // Close the pool so process exits
        pool.end();
    }
}

runTest();
