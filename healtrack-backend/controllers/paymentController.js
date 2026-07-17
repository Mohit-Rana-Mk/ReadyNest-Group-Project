const db = require('../config/db');
const paymentService = require('../services/paymentService');

// A. PATIENT PAYMENT WORKFLOW

// 1. Create Razorpay Order & Pending Appointment
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { patient_id } = req.body;

        // Verify patient profile belongs to logged-in user to prevent IDOR
        const [patientRows] = await db.query(
            `SELECT id FROM patients WHERE id = ? AND user_id = ?`,
            [patient_id, userId]
        );
        if (patientRows.length === 0) {
            return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access to patient profile.' });
        }

        const result = await paymentService.createOrder(req.body);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        if (error.message === 'Missing required fields for appointment booking') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Create Order Error:', error);
        res.status(500).json({ message: 'Error initiating payment: ' + error.message });
    }
};

// 2. Verify Payment Signature
exports.verifyPayment = async (req, res) => {
    try {
        const result = await paymentService.verifyPayment(req.body, req.user?.id);
        
        if (result.alreadyProcessed) {
            return res.status(200).json({ success: true, message: 'Payment already processed' });
        }

        if (req.io) {
            req.io.emit('QUEUE_UPDATE', { clinicId: result.clinicId });
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and appointment confirmed successfully'
        });
    } catch (error) {
        if (error.message === 'Missing payment verification tokens') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Invalid payment signature verification') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Payment record not found') {
            return res.status(404).json({ message: error.message });
        }
        console.error('Verify Payment Error:', error);
        res.status(500).json({ message: 'Payment verification failed: ' + error.message });
    }
};

// 3. Webhook Integration
exports.handleWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        return res.status(500).json({ message: 'Webhook secret is not configured' });
    }

    if (!signature) {
        return res.status(400).json({ message: 'Webhook signature is required' });
    }

    try {
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== signature) {
            return res.status(400).json({ message: 'Webhook signature verification failed' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`Razorpay Webhook Event: ${event}`);

        if (event === 'payment.captured') {
            const paymentDetails = payload.payment.entity;
            const rzpOrderId = paymentDetails.order_id;
            const rzpPaymentId = paymentDetails.id;
            const rzpSignature = signature; // signature header

            // Find payment record by order id
            const [payments] = await db.query(
                `SELECT appointment_id, status, clinic_id FROM payments WHERE razorpay_order_id = ?`,
                [rzpOrderId]
            );

            if (payments.length > 0 && payments[0].status !== 'Paid') {
                const appointment_id = payments[0].appointment_id;

                const connection = await db.getConnection();
                try {
                    await connection.beginTransaction();

                    await connection.execute(
                        `UPDATE appointments SET status = 'Confirmed' WHERE id = ?`,
                        [appointment_id]
                    );

                    await connection.execute(
                        `UPDATE payments 
                         SET status = 'Paid', razorpay_payment_id = ?, razorpay_signature = ? 
                         WHERE appointment_id = ?`,
                        [rzpPaymentId, rzpSignature, appointment_id]
                    );

                    await connection.execute(
                        `UPDATE razorpay_orders SET status = 'paid' WHERE order_id = ?`,
                        [rzpOrderId]
                    );

                    await connection.execute(
                        `INSERT INTO payment_audit_logs (action, details)
                         VALUES ('WEBHOOK_PAYMENT_CAPTURED', ?)`,
                        [JSON.stringify({ order_id: rzpOrderId, payment_id: rzpPaymentId })]
                    );

                    await connection.commit();

                    if (req.io) {
                        req.io.emit('QUEUE_UPDATE', { clinicId: payments[0].clinic_id });
                    }
                } catch (trxErr) {
                    await connection.rollback();
                    throw trxErr;
                } finally {
                    connection.release();
                }
            }
        } else if (event === 'payment.failed') {
            const paymentDetails = payload.payment.entity;
            const rzpOrderId = paymentDetails.order_id;

            await db.execute(
                `UPDATE payments SET status = 'Failed' WHERE razorpay_order_id = ? AND status != 'Paid'`,
                [rzpOrderId]
            );
        }

        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Webhook handler failed' });
    }
};

// 4. Patient Payment History
exports.getPatientPayments = async (req, res) => {
    try {
        const payments = await paymentService.getPatientPayments(req.user.id);
        res.status(200).json(payments);
    } catch (error) {
        if (error.message === 'Patient profile not found') {
            return res.status(404).json({ message: error.message });
        }
        console.error('Fetch Patient Payments Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 5. Download Invoice/Receipt API Details
exports.getPaymentDetails = async (req, res) => {
    const { paymentId } = req.params;
    try {
        const details = await paymentService.getPaymentDetails(paymentId, req.user.id, req.user.role);
        res.status(200).json(details);
    } catch (error) {
        if (error.message === 'Payment record not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Unauthorized access to payment details') {
            return res.status(403).json({ message: error.message });
        }
        console.error('Fetch Payment Details Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 6. Request Refund
exports.requestRefund = async (req, res) => {
    try {
        const result = await paymentService.requestRefund(req.user.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        if (['Payment ID and reason are required', 'Only successful paid payments can be refunded', 'Refund request already submitted for this payment'].includes(error.message)) {
            return res.status(400).json({ message: error.message });
        }
        if (['Patient not found', 'Payment not found or unauthorized'].includes(error.message)) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Request Refund Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// B-RECEPTION. WALK-IN PAYMENT ENDPOINTS (ClinicStaff)
const Razorpay = require('razorpay');
const crypto = require('crypto');
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Creates a Razorpay order for an existing walk-in appointment
exports.createWalkInOrder = async (req, res) => {
    const { appointment_id, patient_id, doctor_id, clinic_id } = req.body;
    if (!appointment_id || !patient_id || !doctor_id || !clinic_id) {
        return res.status(400).json({ message: 'appointment_id, patient_id, doctor_id and clinic_id are required' });
    }
    if (parseInt(clinic_id) !== parseInt(req.user.clinic_id)) {
        return res.status(403).json({ message: 'Forbidden: Unauthorized clinic access.' });
    }
    try {
        // Verify appointment matches patient, doctor, and clinic to prevent IDOR
        const [apptRows] = await db.query(
            `SELECT id FROM appointments WHERE id = ? AND patient_id = ? AND doctor_id = ? AND clinic_id = ?`,
            [appointment_id, patient_id, doctor_id, req.user.clinic_id]
        );
        if (apptRows.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized appointment/clinic combination.' });
        }
        // Get consultation fee
        const [feeRows] = await db.query(
            `SELECT COALESCE(cs.consultation_fee, 500.00) AS fee 
             FROM users u 
             LEFT JOIN clinic_services cs ON u.service_id = cs.service_id AND cs.clinic_id = ?
             WHERE u.id = ? AND u.role = 'Doctor'`,
            [clinic_id, doctor_id]
        );
        const fee = feeRows.length > 0 ? parseFloat(feeRows[0].fee) : 500.00;

        // Create Razorpay order
        const rzpOrder = await razorpayInstance.orders.create({
            amount: Math.round(fee * 100),
            currency: 'INR',
            receipt: `walkin_${appointment_id}`
        });

        // Create payment record
        const receipt_id = `REC-WLK-${Date.now()}-${appointment_id}`;
        const invoice_id = `INV-WLK-${Date.now()}-${appointment_id}`;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [existing] = await connection.query(`SELECT id FROM payments WHERE appointment_id = ?`, [appointment_id]);
            if (existing.length > 0) {
                await connection.execute(
                    `UPDATE payments 
                     SET razorpay_order_id = ?, amount = ?, status = 'Pending', receipt_id = ?, invoice_id = ?
                     WHERE appointment_id = ?`,
                    [rzpOrder.id, fee, receipt_id, invoice_id, appointment_id]
                );
            } else {
                await connection.execute(
                    `INSERT INTO payments (patient_id, doctor_id, clinic_id, appointment_id, razorpay_order_id, amount, status, receipt_id, invoice_id)
                     VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
                    [patient_id, doctor_id, clinic_id, appointment_id, rzpOrder.id, fee, receipt_id, invoice_id]
                );
            }

            const [existingRzp] = await connection.query(`SELECT id FROM razorpay_orders WHERE appointment_id = ?`, [appointment_id]);
            if (existingRzp.length > 0) {
                await connection.execute(
                    `UPDATE razorpay_orders SET order_id = ?, amount = ?, status = 'created' WHERE appointment_id = ?`,
                    [rzpOrder.id, fee, appointment_id]
                );
            } else {
                await connection.execute(
                    `INSERT INTO razorpay_orders (appointment_id, order_id, amount, status) VALUES (?, ?, ?, 'created')`,
                    [appointment_id, rzpOrder.id, fee]
                );
            }

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        res.status(201).json({
            success: true,
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            fee
        });
    } catch (error) {
        console.error('Create WalkIn Order Error:', error);
        res.status(500).json({ message: 'Error creating payment order: ' + error.message });
    }
};

// Verifies Razorpay payment signature for a walk-in appointment
exports.verifyWalkInPayment = async (req, res) => {
    const { appointment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    if (!appointment_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment verification tokens' });
    }
    try {
        // Verify appointment belongs to this clinic
        const [apptRows] = await db.query(
            `SELECT id FROM appointments WHERE id = ? AND clinic_id = ?`,
            [appointment_id, req.user.clinic_id]
        );
        if (apptRows.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Appointment does not belong to this clinic.' });
        }
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({ message: 'Razorpay API Key Secret is not configured' });
        }
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute(`UPDATE appointments SET status = 'Checked-In' WHERE id = ?`, [appointment_id]);
            await connection.execute(
                `UPDATE payments SET status = 'Paid', razorpay_payment_id = ?, razorpay_signature = ? WHERE appointment_id = ?`,
                [razorpay_payment_id, razorpay_signature, appointment_id]
            );
            await connection.execute(`UPDATE razorpay_orders SET status = 'paid' WHERE order_id = ?`, [razorpay_order_id]);
            await connection.execute(
                `INSERT INTO payment_audit_logs (user_id, action, details) VALUES (?, 'WALKIN_ONLINE_PAYMENT', ?)`,
                [req.user?.id || null, JSON.stringify({ appointment_id, razorpay_payment_id })]
            );
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        if (req.io) req.io.emit('QUEUE_UPDATE', { message: 'Walk-in payment confirmed' });
        res.status(200).json({ success: true, message: 'Payment verified and appointment confirmed' });
    } catch (error) {
        console.error('Verify WalkIn Payment Error:', error);
        res.status(500).json({ message: 'Payment verification failed: ' + error.message });
    }
};

// Records a cash payment for a walk-in appointment
exports.recordWalkInCash = async (req, res) => {
    const { appointment_id, patient_id, doctor_id, clinic_id } = req.body;
    if (!appointment_id || !patient_id || !doctor_id || !clinic_id) {
        return res.status(400).json({ message: 'appointment_id, patient_id, doctor_id and clinic_id are required' });
    }
    if (parseInt(clinic_id) !== parseInt(req.user.clinic_id)) {
        return res.status(403).json({ message: 'Forbidden: Unauthorized clinic access.' });
    }
    try {
        // Verify appointment matches patient, doctor, and clinic to prevent IDOR
        const [apptRows] = await db.query(
            `SELECT id FROM appointments WHERE id = ? AND patient_id = ? AND doctor_id = ? AND clinic_id = ?`,
            [appointment_id, patient_id, doctor_id, req.user.clinic_id]
        );
        if (apptRows.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized appointment/clinic combination.' });
        }
        // Get fee
        const [feeRows] = await db.query(
            `SELECT COALESCE(cs.consultation_fee, 500.00) AS fee 
             FROM users u 
             LEFT JOIN clinic_services cs ON u.service_id = cs.service_id AND cs.clinic_id = ?
             WHERE u.id = ? AND u.role = 'Doctor'`,
            [clinic_id, doctor_id]
        );
        const fee = feeRows.length > 0 ? parseFloat(feeRows[0].fee) : 500.00;

        const receipt_id = `REC-CASH-${Date.now()}-${appointment_id}`;
        const invoice_id = `INV-CASH-${Date.now()}-${appointment_id}`;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Check if payment record already exists
            const [existing] = await connection.query(`SELECT id FROM payments WHERE appointment_id = ?`, [appointment_id]);
            if (existing.length > 0) {
                await connection.execute(`UPDATE payments SET status = 'Paid' WHERE appointment_id = ?`, [appointment_id]);
            } else {
                await connection.execute(
                    `INSERT INTO payments (patient_id, doctor_id, clinic_id, appointment_id, razorpay_order_id, amount, status, receipt_id, invoice_id)
                     VALUES (?, ?, ?, ?, ?, ?, 'Paid', ?, ?)`,
                    [patient_id, doctor_id, clinic_id, appointment_id, `CASH-${appointment_id}`, fee, receipt_id, invoice_id]
                );
            }
            await connection.execute(`UPDATE appointments SET status = 'Checked-In' WHERE id = ?`, [appointment_id]);
            await connection.execute(
                `INSERT INTO payment_audit_logs (user_id, action, details) VALUES (?, 'WALKIN_CASH_PAYMENT', ?)`,
                [req.user?.id || null, JSON.stringify({ appointment_id, amount: fee, receipt_id })]
            );
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        if (req.io) req.io.emit('QUEUE_UPDATE', { message: 'Walk-in cash payment recorded' });
        res.status(200).json({ success: true, message: 'Cash payment recorded successfully', receipt_id, fee });
    } catch (error) {
        console.error('Record WalkIn Cash Error:', error);
        res.status(500).json({ message: 'Error recording cash payment: ' + error.message });
    }
};


// B. CLINIC BANK DETAILS MODULE

// 1. Get Clinic Bank Details
exports.getClinicBankDetails = async (req, res) => {
    const clinicId = req.user.clinic_id;

    if (!clinicId) {
        return res.status(400).json({ message: 'Clinic ID is required' });
    }

    try {
        const [details] = await db.query(
            `SELECT id, clinic_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, upi_id, status 
             FROM clinic_bank_accounts 
             WHERE clinic_id = ?`,
            [clinicId]
        );

        if (details.length === 0) {
            return res.status(200).json({ exists: false });
        }

        res.status(200).json({ exists: true, data: details[0] });
    } catch (error) {
        console.error('Fetch Bank Details Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 2. Update Clinic Bank Details
exports.updateClinicBankDetails = async (req, res) => {
    const clinicId = req.user.clinic_id;
    const { account_holder_name, bank_name, account_number, ifsc_code, branch_name, upi_id } = req.body;

    if (!clinicId || !account_holder_name || !bank_name || !account_number || !ifsc_code) {
        return res.status(400).json({ message: 'Missing required bank detail fields' });
    }

    try {
        // Enforce approval system: setting status to 'Pending' on change
        const [existing] = await db.query(`SELECT id FROM clinic_bank_accounts WHERE clinic_id = ?`, [clinicId]);

        if (existing.length > 0) {
            await db.execute(
                `UPDATE clinic_bank_accounts 
                 SET account_holder_name = ?, bank_name = ?, account_number = ?, ifsc_code = ?, branch_name = ?, upi_id = ?, status = 'Pending'
                 WHERE clinic_id = ?`,
                [account_holder_name, bank_name, account_number, ifsc_code, branch_name || null, upi_id || null, clinicId]
            );
        } else {
            await db.execute(
                `INSERT INTO clinic_bank_accounts (clinic_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, upi_id, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                [clinicId, account_holder_name, bank_name, account_number, ifsc_code, branch_name || null, upi_id || null]
            );
        }

        res.status(200).json({ success: true, message: 'Bank details submitted and pending Admin approval.' });
    } catch (error) {
        console.error('Update Bank Details Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// C. CLINIC DASHBOARD OVERVIEW

exports.getClinicFinancials = async (req, res) => {
    const clinicId = req.user.clinic_id;

    if (!clinicId) {
        return res.status(400).json({ message: 'Clinic ID is required' });
    }

    try {
        // 1. Total Successful Revenue
        const [revRows] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_revenue 
             FROM payments 
             WHERE clinic_id = ? AND status = 'Paid'`,
            [clinicId]
        );
        const totalRevenue = parseFloat(revRows[0].total_revenue);

        // 2. Total Settled
        const [setRows] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_settled, MAX(settlement_date) AS last_settlement_date 
             FROM settlement_records 
             WHERE clinic_id = ?`,
            [clinicId]
        );
        const totalSettled = parseFloat(setRows[0].total_settled);
        const lastSettlementDate = setRows[0].last_settlement_date;

        // Pending Settlement
        const pendingSettlement = totalRevenue - totalSettled;

        // 3. Payment-wise breakdown
        const [breakdown] = await db.query(
            `SELECT p.id, p.amount, p.status, p.receipt_id, p.created_at,
                    pat.name AS patient_name, du.name AS doctor_name
             FROM payments p
             JOIN patients pat ON p.patient_id = pat.id
             JOIN users du ON p.doctor_id = du.id
             WHERE p.clinic_id = ?
             ORDER BY p.created_at DESC`,
            [clinicId]
        );

        // 4. Settlement History
        const [settlements] = await db.query(
            `SELECT id, amount, settlement_date, reference_number, remarks 
             FROM settlement_records 
             WHERE clinic_id = ? 
             ORDER BY settlement_date DESC`,
            [clinicId]
        );

        res.status(200).json({
            totalRevenue,
            totalSettled,
            pendingSettlement,
            lastSettlementDate,
            breakdown,
            settlements
        });

    } catch (error) {
        console.error('Fetch Clinic Financials Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// D. ADMIN DASHBOARD ENHANCEMENTS

// 1. Overview analytics
exports.getAdminOverview = async (req, res) => {
    try {
        // Revenue calculations
        const [revRows] = await db.query(`
            SELECT 
                COALESCE(SUM(amount), 0) AS total,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN amount ELSE 0 END), 0) AS today,
                COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS monthly
            FROM payments 
            WHERE status = 'Paid'
        `);

        const [statusRows] = await db.query(`
            SELECT 
                COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pending,
                COUNT(CASE WHEN status = 'Paid' THEN 1 END) AS successful,
                COUNT(CASE WHEN status = 'Failed' THEN 1 END) AS failed,
                COUNT(CASE WHEN status = 'Refunded' THEN 1 END) AS refunded
            FROM payments
        `);

        res.status(200).json({
            revenue: {
                total: parseFloat(revRows[0].total),
                today: parseFloat(revRows[0].today),
                monthly: parseFloat(revRows[0].monthly)
            },
            status: statusRows[0]
        });
    } catch (error) {
        console.error('Admin Overview Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 2. View all payments with filter & search
exports.getAllPayments = async (req, res) => {
    const { status, search, clinic_id } = req.query;

    try {
        let query = `
            SELECT p.id, p.amount, p.status, p.receipt_id, p.invoice_id, p.created_at, p.razorpay_payment_id, p.razorpay_order_id,
                   c.name AS clinic_name, du.name AS doctor_name, pat.name AS patient_name,
                   rr.id AS refund_request_id, rr.status AS refund_request_status
            FROM payments p
            JOIN clinics c ON p.clinic_id = c.id
            JOIN users du ON p.doctor_id = du.id
            JOIN patients pat ON p.patient_id = pat.id
            LEFT JOIN refund_requests rr ON p.id = rr.payment_id
        `;

        const conditions = [];
        const params = [];

        if (status) {
            conditions.push("p.status = ?");
            params.push(status);
        }
        if (clinic_id) {
            conditions.push("p.clinic_id = ?");
            params.push(clinic_id);
        }
        if (search) {
            conditions.push("(p.receipt_id LIKE ? OR p.invoice_id LIKE ? OR p.razorpay_payment_id LIKE ? OR pat.name LIKE ?)");
            const sVal = `%${search}%`;
            params.push(sVal, sVal, sVal, sVal);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY p.created_at DESC";

        const [payments] = await db.query(query, params);
        res.status(200).json(payments);

    } catch (error) {
        console.error('Fetch All Payments Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 3. Clinics settlement summary list
exports.getClinicsSettlementSummary = async (req, res) => {
    try {
        // Query to compute Total Earnings, Total Settled, Pending and Last Date for all clinics
        const [rows] = await db.query(`
            SELECT c.id AS clinic_id, c.name AS clinic_name,
                   COALESCE(ba.account_holder_name, '') AS account_holder_name,
                   COALESCE(ba.bank_name, '') AS bank_name,
                   COALESCE(ba.account_number, '') AS account_number,
                   COALESCE(ba.ifsc_code, '') AS ifsc_code,
                   COALESCE(ba.branch_name, '') AS branch_name,
                   COALESCE(ba.upi_id, '') AS upi_id,
                   COALESCE(ba.status, 'None') AS bank_status,
                   
                   -- Total Earnings (Paid payments)
                   COALESCE((SELECT SUM(amount) FROM payments WHERE clinic_id = c.id AND status = 'Paid'), 0) AS total_earnings,
                   
                   -- Total Settled (manual settlements)
                   COALESCE((SELECT SUM(amount) FROM settlement_records WHERE clinic_id = c.id), 0) AS total_settled,
                   
                   -- Last settlement date
                   (SELECT MAX(settlement_date) FROM settlement_records WHERE clinic_id = c.id) AS last_settlement_date
            FROM clinics c
            LEFT JOIN clinic_bank_accounts ba ON c.id = ba.clinic_id
            WHERE c.verification_status = 'Approved'
        `);

        // Compute pending values in JS for safety
        const clinics = rows.map(r => {
            const earnings = parseFloat(r.total_earnings);
            const settled = parseFloat(r.total_settled);
            return {
                ...r,
                total_earnings: earnings,
                total_settled: settled,
                pending_settlement: Math.max(0, earnings - settled)
            };
        });

        res.status(200).json(clinics);
    } catch (error) {
        console.error('Fetch Clinics Settlement Summary Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 4. Mark Settlement as Paid
exports.recordSettlement = async (req, res) => {
    const { clinic_id, amount, reference_number, remarks } = req.body;

    if (!clinic_id || !amount || !reference_number) {
        return res.status(400).json({ message: 'Clinic ID, amount, and reference number are required' });
    }

    try {
        // Fetch current financials
        const [revRows] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE clinic_id = ? AND status = 'Paid'`,
            [clinic_id]
        );
        const [setRows] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_settled FROM settlement_records WHERE clinic_id = ?`,
            [clinic_id]
        );

        const totalRevenue = parseFloat(revRows[0].total_revenue);
        const totalSettled = parseFloat(setRows[0].total_settled);
        const pendingSettlement = totalRevenue - totalSettled;

        if (parseFloat(amount) > pendingSettlement) {
            return res.status(400).json({ 
                message: `Settlement amount (${amount}) exceeds pending balance (${pendingSettlement.toFixed(2)})` 
            });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `INSERT INTO settlement_records (clinic_id, amount, reference_number, remarks)
                 VALUES (?, ?, ?, ?)`,
                [clinic_id, amount, reference_number, remarks || null]
            );

            await connection.execute(
                `INSERT INTO payment_audit_logs (user_id, action, details)
                 VALUES (?, 'SETTLEMENT_RECORDED', ?)`,
                [req.user?.id || null, JSON.stringify({ clinic_id, amount, reference_number })]
            );

            await connection.commit();
            res.status(201).json({ success: true, message: 'Settlement recorded successfully' });
        } catch (trxErr) {
            await connection.rollback();
            throw trxErr;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Record Settlement Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 5. Get pending bank accounts for approval
exports.getPendingBankAccounts = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ba.id, ba.clinic_id, ba.account_holder_name, ba.bank_name, ba.account_number, ba.ifsc_code, ba.branch_name, ba.upi_id, ba.status,
                   c.name AS clinic_name
            FROM clinic_bank_accounts ba
            JOIN clinics c ON ba.clinic_id = c.id
            WHERE ba.status = 'Pending'
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Fetch Pending Bank Accounts Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 6. Approve / Reject Bank Details
exports.approveBankDetails = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected.' });
    }

    try {
        await db.execute(
            `UPDATE clinic_bank_accounts SET status = ? WHERE id = ?`,
            [status, id]
        );

        await db.execute(
            `INSERT INTO payment_audit_logs (user_id, action, details)
             VALUES (?, 'BANK_DETAILS_MODERATED', ?)`,
            [req.user?.id || null, JSON.stringify({ account_id: id, status })]
        );

        res.status(200).json({ success: true, message: `Bank details successfully ${status.toLowerCase()}` });
    } catch (error) {
        console.error('Approve Bank Details Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 7. Get Refund Requests
exports.getRefundRequests = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT rr.id, rr.amount, rr.reason, rr.status, rr.requested_at,
                   p.receipt_id, p.razorpay_payment_id,
                   c.name AS clinic_name, pat.name AS patient_name
            FROM refund_requests rr
            JOIN payments p ON rr.payment_id = p.id
            JOIN clinics c ON p.clinic_id = c.id
            JOIN patients pat ON p.patient_id = pat.id
            ORDER BY rr.requested_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Fetch Refund Requests Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 8. Process Refund (Approve/Reject)
exports.processRefund = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const [refunds] = await db.query(
            `SELECT rr.id, rr.payment_id, rr.amount, p.razorpay_payment_id 
             FROM refund_requests rr
             JOIN payments p ON rr.payment_id = p.id
             WHERE rr.id = ?`,
            [id]
        );

        if (refunds.length === 0) {
            return res.status(404).json({ message: 'Refund request not found' });
        }

        const refund = refunds[0];

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE refund_requests SET status = ?, processed_at = NOW() WHERE id = ?`,
                [status, id]
            );

            if (status === 'Approved') {
                // Mark payment as Refunded
                await connection.execute(
                    `UPDATE payments SET status = 'Refunded' WHERE id = ?`,
                    [refund.payment_id]
                );

                // Here we would call Razorpay refund API in production
                // const rzpRefund = await razorpay.payments.refund(refund.razorpay_payment_id, { amount: refund.amount * 100 });
            }

            await connection.execute(
                `INSERT INTO payment_audit_logs (user_id, action, details)
                 VALUES (?, 'REFUND_PROCESSED', ?)`,
                [req.user?.id || null, JSON.stringify({ refund_id: id, status, amount: refund.amount })]
            );

            await connection.commit();
            res.status(200).json({ success: true, message: `Refund request successfully ${status.toLowerCase()}` });

        } catch (trxErr) {
            await connection.rollback();
            throw trxErr;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Process Refund Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// E. RECEPTIONIST PAYMENT HISTORY & REFUND
exports.getReceptionPayments = async (req, res) => {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) {
        return res.status(400).json({ message: 'Clinic ID is required' });
    }

    try {
        const [payments] = await db.query(
            `SELECT p.id, p.amount, p.status, p.receipt_id, p.invoice_id, p.created_at, p.appointment_id,
                    pat.name AS patient_name, du.name AS doctor_name, a.status AS appointment_status
             FROM payments p
             JOIN patients pat ON p.patient_id = pat.id
             JOIN users du ON p.doctor_id = du.id
             LEFT JOIN appointments a ON p.appointment_id = a.id
             WHERE p.clinic_id = ?
             ORDER BY p.created_at DESC`,
            [clinicId]
        );
        res.status(200).json(payments);
    } catch (error) {
        console.error('Fetch Reception Payments Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.processReceptionRefund = async (req, res) => {
    const clinicId = req.user?.clinic_id;
    const { payment_id, reason } = req.body;

    if (!clinicId) {
        return res.status(400).json({ message: 'Clinic ID is required' });
    }
    if (!payment_id || !reason) {
        return res.status(400).json({ message: 'Payment ID and refund reason are required' });
    }

    try {
        const [payments] = await db.query(
            `SELECT id, amount, status, appointment_id FROM payments WHERE id = ? AND clinic_id = ?`,
            [payment_id, clinicId]
        );

        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        const payment = payments[0];
        if (payment.status !== 'Paid') {
            return res.status(400).json({ message: 'Only successful paid payments can be refunded' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Mark payment as Refunded
            await connection.execute(
                `UPDATE payments SET status = 'Refunded' WHERE id = ?`,
                [payment_id]
            );

            // Mark appointment as Cancelled
            if (payment.appointment_id) {
                await connection.execute(
                    `UPDATE appointments SET status = 'Cancelled' WHERE id = ?`,
                    [payment.appointment_id]
                );
            }

            // Create refund request and mark it Approved immediately
            await connection.execute(
                `INSERT INTO refund_requests (payment_id, amount, reason, status, processed_at)
                 VALUES (?, ?, ?, 'Approved', NOW())`,
                [payment_id, payment.amount, `Reception: ${reason}`]
            );

            // Log audit trace
            await connection.execute(
                `INSERT INTO payment_audit_logs (user_id, action, details)
                 VALUES (?, 'RECEPTION_REFUND', ?)`,
                [req.user?.id || null, JSON.stringify({ payment_id, amount: payment.amount, reason })]
            );

            await connection.commit();

            if (req.io) {
                req.io.emit('QUEUE_UPDATE', { clinicId });
            }

            res.status(200).json({ success: true, message: 'Payment successfully refunded and appointment cancelled.' });
        } catch (trxErr) {
            await connection.rollback();
            throw trxErr;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Reception Process Refund Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Cancels/Rollbacks a pending walk-in payment
exports.cancelWalkInPayment = async (req, res) => {
    const { appointment_id } = req.body;
    if (!appointment_id) {
        return res.status(400).json({ message: 'appointment_id is required' });
    }
    try {
        const [apptRows] = await db.query(
            `SELECT id FROM appointments WHERE id = ? AND clinic_id = ?`,
            [appointment_id, req.user.clinic_id]
        );
        if (apptRows.length === 0) {
            return res.status(403).json({ message: 'Forbidden: Appointment does not belong to this clinic.' });
        }

        const [paymentRows] = await db.query(
            `SELECT id, status FROM payments WHERE appointment_id = ?`,
            [appointment_id]
        );
        if (paymentRows.length === 0) {
            return res.status(200).json({ success: true, message: 'No payment record to cancel' });
        }

        const payment = paymentRows[0];
        if (payment.status === 'Paid') {
            return res.status(400).json({ message: 'Cannot cancel a paid payment' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Delete payments and razorpay_orders
            await connection.execute(`DELETE FROM payments WHERE appointment_id = ?`, [appointment_id]);
            await connection.execute(`DELETE FROM razorpay_orders WHERE appointment_id = ?`, [appointment_id]);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        if (req.io) req.io.emit('QUEUE_UPDATE', { message: 'Walk-in payment order cancelled' });
        res.status(200).json({ success: true, message: 'Walk-in payment order cancelled successfully.' });
    } catch (error) {
        console.error('Cancel WalkIn Payment Error:', error);
        res.status(500).json({ message: 'Error cancelling payment order: ' + error.message });
    }
};

