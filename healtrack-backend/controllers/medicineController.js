const db = require('../config/db');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Helper for audit logging
async function logAudit(userName, role, ipAddress, action, details) {
    try {
        await db.execute(
            `INSERT INTO pharmacy_audit_logs (user_name, role, ip_address, action, details)
             VALUES (?, ?, ?, ?, ?)`,
            [userName, role, ipAddress || 'N/A', action, typeof details === 'object' ? JSON.stringify(details) : details]
        );
    } catch (err) {
        console.error('Audit Logging Failed:', err);
    }
}

// 1. Get Prescription Queue (clinic-isolated or global for standalone pharmacy)
exports.getPrescriptionQueue = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id || null;

        const query = clinicId
            ? `SELECT 
                pr.id as prescription_id,
                pr.created_at as prescribed_at,
                pr.diagnosis,
                a.id as appointment_id,
                a.appointment_date,
                p.id as patient_id,
                p.mrn as patient_mrn,
                p.name as patient_name,
                p.date_of_birth,
                p.gender,
                pu.phone as patient_phone,
                d.id as doctor_id,
                d.name as doctor_name,
                s.name as department_name
             FROM prescriptions pr
             JOIN appointments a ON pr.appointment_id = a.id
             JOIN patients p ON pr.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN users d ON pr.doctor_id = d.id
             LEFT JOIN services s ON d.service_id = s.id
             WHERE a.clinic_id = ?
               AND pr.id NOT IN (
                   SELECT pb.prescription_id 
                   FROM pharmacy_bills pb 
                   WHERE pb.prescription_id IS NOT NULL 
                     AND pb.payment_status IN ('Paid', 'Pending')
               )
             ORDER BY pr.created_at DESC`
            : `SELECT 
                pr.id as prescription_id,
                pr.created_at as prescribed_at,
                pr.diagnosis,
                a.id as appointment_id,
                a.appointment_date,
                p.id as patient_id,
                p.mrn as patient_mrn,
                p.name as patient_name,
                p.date_of_birth,
                p.gender,
                pu.phone as patient_phone,
                d.id as doctor_id,
                d.name as doctor_name,
                s.name as department_name
             FROM prescriptions pr
             JOIN appointments a ON pr.appointment_id = a.id
             JOIN patients p ON pr.patient_id = p.id
             JOIN users pu ON p.user_id = pu.id
             JOIN users d ON pr.doctor_id = d.id
             LEFT JOIN services s ON d.service_id = s.id
             WHERE pr.id NOT IN (
                   SELECT pb.prescription_id 
                   FROM pharmacy_bills pb 
                   WHERE pb.prescription_id IS NOT NULL 
                     AND pb.payment_status IN ('Paid', 'Pending')
               )
             ORDER BY pr.created_at DESC`;

        const [prescriptions] = clinicId
            ? await db.query(query, [clinicId])
            : await db.query(query);

        res.status(200).json(prescriptions);
    } catch (error) {
        console.error('Fetch Prescriptions Queue Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 2. Get Prescription Details
exports.getPrescriptionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const clinicId = req.user.clinic_id;

        // Verify prescription clinic ownership
        const [prescRows] = await db.query(
            `SELECT pr.id FROM prescriptions pr
             JOIN appointments a ON pr.appointment_id = a.id
             WHERE pr.id = ? AND a.clinic_id = ?`,
            [id, clinicId]
        );

        if (prescRows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized or Prescription not found.' });
        }

        const [items] = await db.query(
            `SELECT id, prescription_id, medicine_name, dosage, frequency, duration, instructions
             FROM prescription_items
             WHERE prescription_id = ?`,
            [id]
        );

        res.status(200).json(items);
    } catch (error) {
        console.error('Fetch Prescription Details Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 3. Get Inventory (clinic-isolated or global for standalone pharmacy)
exports.getInventory = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id || null;

        const [inventory] = clinicId
            ? await db.query(
                `SELECT id, medicine_name, generic_name, brand, batch_number, expiry_date,
                        purchase_price, selling_price, available_quantity, min_stock_alert,
                        supplier_details, gst_percent, barcode, clinic_id, created_at, updated_at
                 FROM pharmacy_medicines
                 WHERE clinic_id = ?
                 ORDER BY medicine_name ASC`,
                [clinicId]
              )
            : await db.query(
                `SELECT pm.id, pm.medicine_name, pm.generic_name, pm.brand, pm.batch_number, pm.expiry_date,
                        pm.purchase_price, pm.selling_price, pm.available_quantity, pm.min_stock_alert,
                        pm.supplier_details, pm.gst_percent, pm.barcode, pm.clinic_id,
                        c.name as clinic_name, pm.created_at, pm.updated_at
                 FROM pharmacy_medicines pm
                 LEFT JOIN clinics c ON c.id = pm.clinic_id
                 ORDER BY pm.medicine_name ASC`
              );

        res.status(200).json(inventory);
    } catch (error) {
        console.error('Fetch Inventory Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 4. Add Medicine to Inventory
exports.addMedicine = async (req, res) => {
    const clinicId = req.user.clinic_id;
    const {
        medicine_name, generic_name, brand, batch_number, expiry_date,
        purchase_price, selling_price, available_quantity, min_stock_alert,
        supplier_details, gst_percent, barcode
    } = req.body;

    if (!medicine_name || !generic_name || !brand || !batch_number || !expiry_date ||
        purchase_price === undefined || selling_price === undefined || available_quantity === undefined) {
        return res.status(400).json({ message: 'Missing required inventory fields' });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO pharmacy_medicines 
                (clinic_id, medicine_name, generic_name, brand, batch_number, expiry_date,
                 purchase_price, selling_price, available_quantity, min_stock_alert, supplier_details, gst_percent, barcode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clinicId, medicine_name, generic_name, brand, batch_number, expiry_date,
                purchase_price, selling_price, available_quantity, min_stock_alert || 10,
                supplier_details || null, gst_percent || 0.00, barcode || null
            ]
        );

        const medicineId = result.insertId;

        // Log Stock Transaction
        await db.execute(
            `INSERT INTO pharmacy_stock_logs (medicine_id, user_id, action, quantity, details)
             VALUES (?, ?, 'Added', ?, ?)`,
            [medicineId, req.user.id, available_quantity, `Initial stock upload for batch ${batch_number}`]
        );

        // Log Audit
        await logAudit(
            req.user.name,
            req.user.role,
            req.ip,
            'ADD_MEDICINE',
            { medicine_name, brand, batch_number, qty: available_quantity }
        );

        res.status(201).json({ success: true, message: 'Medicine successfully added to inventory', id: medicineId });
    } catch (error) {
        console.error('Add Medicine Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 5. Update Medicine Details/Stock
exports.updateMedicine = async (req, res) => {
    const clinicId = req.user.clinic_id;
    const { id } = req.params;
    const {
        medicine_name, generic_name, brand, batch_number, expiry_date,
        purchase_price, selling_price, available_quantity, min_stock_alert,
        supplier_details, gst_percent, barcode
    } = req.body;

    try {
        // Verify ownership
        const [existing] = await db.query(
            `SELECT id, available_quantity, batch_number FROM pharmacy_medicines WHERE id = ? AND clinic_id = ?`,
            [id, clinicId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        const oldQty = existing[0].available_quantity;
        const diffQty = available_quantity - oldQty;

        await db.execute(
            `UPDATE pharmacy_medicines 
             SET medicine_name = ?, generic_name = ?, brand = ?, batch_number = ?, expiry_date = ?,
                 purchase_price = ?, selling_price = ?, available_quantity = ?, min_stock_alert = ?,
                 supplier_details = ?, gst_percent = ?, barcode = ?
             WHERE id = ?`,
            [
                medicine_name, generic_name, brand, batch_number, expiry_date,
                purchase_price, selling_price, available_quantity, min_stock_alert,
                supplier_details, gst_percent, barcode, id
            ]
        );

        if (diffQty !== 0) {
            const action = diffQty > 0 ? 'Increased' : 'Decreased';
            await db.execute(
                `INSERT INTO pharmacy_stock_logs (medicine_id, user_id, action, quantity, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, req.user.id, action, Math.abs(diffQty), `Manual quantity adjustment from ${oldQty} to ${available_quantity}`]
            );
        }

        // Audit
        await logAudit(
            req.user.name,
            req.user.role,
            req.ip,
            'UPDATE_MEDICINE',
            { id, medicine_name, qty_diff: diffQty }
        );

        res.status(200).json({ success: true, message: 'Medicine updated successfully' });
    } catch (error) {
        console.error('Update Medicine Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 6. Delete Medicine
exports.deleteMedicine = async (req, res) => {
    const clinicId = req.user.clinic_id;
    const { id } = req.params;

    try {
        // Verify ownership
        const [existing] = await db.query(
            `SELECT id, medicine_name FROM pharmacy_medicines WHERE id = ? AND clinic_id = ?`,
            [id, clinicId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        await db.execute(`DELETE FROM pharmacy_medicines WHERE id = ?`, [id]);

        // Audit
        await logAudit(
            req.user.name,
            req.user.role,
            req.ip,
            'DELETE_MEDICINE',
            { id, name: existing[0].medicine_name }
        );

        res.status(200).json({ success: true, message: 'Medicine removed from inventory successfully' });
    } catch (error) {
        console.error('Delete Medicine Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 7. Dispense Medicines & Bill (Main workflow)
exports.dispenseMedicines = async (req, res) => {
    const clinicId = req.user.clinic_id;
    const {
        prescription_id,
        patient_id,
        doctor_id,
        patient_name,
        doctor_name,
        items, // array of { medicine_id, quantity }
        discount_amount,
        payment_method // 'Cash' or 'Online'
    } = req.body;

    if (!patient_id || !doctor_id || !patient_name || !doctor_name || !items || items.length === 0 || !payment_method) {
        return res.status(400).json({ message: 'Missing billing information or items' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let subtotal = 0;
        let totalGstAmount = 0;
        const validatedItems = [];

        // Validate stock and pricing
        for (const item of items) {
            const [medRows] = await connection.query(
                `SELECT id, medicine_name, selling_price, available_quantity, gst_percent 
                 FROM pharmacy_medicines 
                 WHERE id = ? AND clinic_id = ?`,
                [item.medicine_id, clinicId]
            );

            if (medRows.length === 0) {
                throw new Error(`Medicine ID ${item.medicine_id} not found in inventory.`);
            }

            const med = medRows[0];
            if (med.available_quantity < item.quantity) {
                throw new Error(`Insufficient stock for "${med.medicine_name}". Available: ${med.available_quantity}, Requested: ${item.quantity}`);
            }

            const itemUnitPrice = parseFloat(med.selling_price);
            const itemTotalPrice = itemUnitPrice * item.quantity;
            const itemGst = itemTotalPrice * (parseFloat(med.gst_percent) / 100);

            subtotal += itemTotalPrice;
            totalGstAmount += itemGst;

            validatedItems.push({
                medicine_id: med.id,
                medicine_name: med.medicine_name,
                quantity: item.quantity,
                unit_price: itemUnitPrice,
                total_price: itemTotalPrice,
                gst_percent: med.gst_percent
            });
        }

        const discount = discount_amount ? parseFloat(discount_amount) : 0;
        const grandTotal = Math.max(0, subtotal + totalGstAmount - discount);

        // Unique bill and receipt numbers
        const billNumber = `BILL-PHM-${Date.now()}`;
        const receiptNumber = payment_method === 'Cash' ? `REC-PHM-${Date.now()}` : null;
        const paymentStatus = payment_method === 'Cash' ? 'Paid' : 'Pending';

        // Insert Bill
        const [billResult] = await connection.execute(
            `INSERT INTO pharmacy_bills 
                (bill_number, clinic_id, prescription_id, patient_id, doctor_id, patient_name, doctor_name, 
                 subtotal, gst_amount, discount_amount, grand_total, payment_method, payment_status, receipt_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                billNumber, clinicId, prescription_id || null, patient_id, doctor_id, patient_name, doctor_name,
                subtotal, totalGstAmount, discount, grandTotal, payment_method, paymentStatus, receiptNumber
            ]
        );

        const billId = billResult.insertId;

        // Insert Bill Items, Deduct Stock, and Log Stock Movement
        for (const item of validatedItems) {
            await connection.execute(
                `INSERT INTO pharmacy_bill_items (bill_id, medicine_id, medicine_name, quantity, unit_price, total_price)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [billId, item.medicine_id, item.medicine_name, item.quantity, item.unit_price, item.total_price]
            );

            // Deduct Stock
            await connection.execute(
                `UPDATE pharmacy_medicines 
                 SET available_quantity = available_quantity - ? 
                 WHERE id = ?`,
                [item.quantity, item.medicine_id]
            );

            // Log Stock movement
            await connection.execute(
                `INSERT INTO pharmacy_stock_logs (medicine_id, user_id, action, quantity, details)
                 VALUES (?, ?, 'Dispensed', ?, ?)`,
                [item.medicine_id, req.user.id, item.quantity, `Dispensed to patient for bill ${billNumber}`]
            );
        }

        // Handle Razorpay Order Creation if Online
        let rzpOrderDetails = null;
        if (payment_method === 'Online') {
            const rzpOrder = await razorpayInstance.orders.create({
                amount: Math.round(grandTotal * 100), // in paisa
                currency: 'INR',
                receipt: `pharmacy_${billId}`
            });

            await connection.execute(
                `UPDATE pharmacy_bills SET razorpay_order_id = ? WHERE id = ?`,
                [rzpOrder.id, billId]
            );

            rzpOrderDetails = {
                orderId: rzpOrder.id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID
            };
        }

        await connection.commit();

        // ── Mark appointment 'Completed' (Cash payments are immediately done) ──
        if (payment_method === 'Cash' && prescription_id) {
            try {
                const [prescRows] = await db.query(
                    `SELECT appointment_id FROM prescriptions WHERE id = ?`,
                    [prescription_id]
                );
                if (prescRows.length > 0 && prescRows[0].appointment_id) {
                    await db.execute(
                        `UPDATE appointments SET status = 'Completed' WHERE id = ?`,
                        [prescRows[0].appointment_id]
                    );
                    if (req.io) req.io.emit('QUEUE_UPDATE', { message: 'Medicines dispensed, appointment completed' });
                }
            } catch (apptErr) {
                console.error('Warning: Could not mark appointment as Completed:', apptErr);
            }
        }

        // Audit Logging
        await logAudit(
            req.user.name,
            req.user.role,
            req.ip,
            'DISPENSE_BILL',
            { bill_id: billId, bill_number: billNumber, grand_total: grandTotal, payment_method }
        );

        res.status(201).json({
            success: true,
            message: payment_method === 'Cash' ? 'Medicines dispensed & Cash Payment recorded!' : 'Order created for online payment.',
            billId,
            billNumber,
            grandTotal,
            receiptNumber,
            rzpOrder: rzpOrderDetails
        });

    } catch (error) {
        await connection.rollback();
        console.error('Dispense Medicines Error:', error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    } finally {
        connection.release();
    }
};

// 8. Verify Razorpay Online Payment Signature
exports.verifyOnlinePayment = async (req, res) => {
    const { bill_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    if (!bill_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment signature verification parameters' });
    }

    try {
        const clinicId = req.user.clinic_id;

        // Fetch Bill Details
        const [billRows] = await db.query(
            `SELECT id, grand_total FROM pharmacy_bills WHERE id = ? AND clinic_id = ?`,
            [bill_id, clinicId]
        );

        if (billRows.length === 0) {
            return res.status(404).json({ message: 'Pharmacy bill not found' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({ message: 'Razorpay Key Secret is not configured' });
        }

        // Verify HMAC
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
        
        if (expectedSignature !== razorpay_signature) {
            // Restore stock
            const [billItems] = await db.query(
                `SELECT medicine_id, quantity FROM pharmacy_bill_items WHERE bill_id = ?`,
                [bill_id]
            );
            for (const item of billItems) {
                await db.execute(
                    `UPDATE pharmacy_medicines SET available_quantity = available_quantity + ? WHERE id = ?`,
                    [item.quantity, item.medicine_id]
                );
            }
            await db.execute(
                `UPDATE pharmacy_bills SET payment_status = 'Failed' WHERE id = ?`,
                [bill_id]
            );
            return res.status(400).json({ message: 'Invalid payment signature verification' });
        }

        const receiptNumber = `REC-PHM-${Date.now()}`;

        // Complete Bill Payment
        await db.execute(
            `UPDATE pharmacy_bills 
             SET payment_status = 'Paid', receipt_number = ?, razorpay_payment_id = ?, razorpay_signature = ? 
             WHERE id = ?`,
            [receiptNumber, razorpay_payment_id, razorpay_signature, bill_id]
        );

        // ── Mark appointment 'Completed' (Online payment confirmed) ──
        try {
            const [billPrescRows] = await db.query(
                `SELECT prescription_id FROM pharmacy_bills WHERE id = ?`,
                [bill_id]
            );
            if (billPrescRows.length > 0 && billPrescRows[0].prescription_id) {
                const [prescRows] = await db.query(
                    `SELECT appointment_id FROM prescriptions WHERE id = ?`,
                    [billPrescRows[0].prescription_id]
                );
                if (prescRows.length > 0 && prescRows[0].appointment_id) {
                    await db.execute(
                        `UPDATE appointments SET status = 'Completed' WHERE id = ?`,
                        [prescRows[0].appointment_id]
                    );
                    if (req.io) req.io.emit('QUEUE_UPDATE', { message: 'Online payment confirmed, appointment completed' });
                }
            }
        } catch (apptErr) {
            console.error('Warning: Could not mark appointment as Completed:', apptErr);
        }

        // Audit Log
        await logAudit(
            req.user.name,
            req.user.role,
            req.ip,
            'VERIFY_ONLINE_PAYMENT',
            { bill_id, payment_id: razorpay_payment_id, receiptNumber }
        );

        res.status(200).json({ success: true, message: 'Online payment verified and receipt generated.', receiptNumber });

    } catch (error) {
        console.error('Verify Online Payment Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 8b. Cancel Bill (Rollback Stock for cancelled/failed payments)
exports.cancelBill = async (req, res) => {
    const { bill_id } = req.body;
    if (!bill_id) {
        return res.status(400).json({ message: 'Bill ID is required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const clinicId = req.user.clinic_id;

        // Fetch Bill Details
        const [billRows] = await connection.query(
            `SELECT id, payment_status FROM pharmacy_bills WHERE id = ? AND clinic_id = ?`,
            [bill_id, clinicId]
        );

        if (billRows.length === 0) {
            return res.status(404).json({ message: 'Pharmacy bill not found' });
        }

        const bill = billRows[0];
        if (bill.payment_status === 'Paid') {
            return res.status(400).json({ message: 'Cannot cancel a paid bill' });
        }

        // Fetch Bill Items to restore stock
        const [billItems] = await connection.query(
            `SELECT medicine_id, quantity FROM pharmacy_bill_items WHERE bill_id = ?`,
            [bill_id]
        );

        // Restore stock and log
        for (const item of billItems) {
            await connection.execute(
                `UPDATE pharmacy_medicines 
                 SET available_quantity = available_quantity + ? 
                 WHERE id = ?`,
                [item.quantity, item.medicine_id]
            );

            await connection.execute(
                `INSERT INTO pharmacy_stock_logs (medicine_id, user_id, action, quantity, details)
                 VALUES (?, ?, 'Restored', ?, ?)`,
                [item.medicine_id, req.user.id, item.quantity, `Stock restored due to cancelled bill #${bill_id}`]
            );
        }

        // Mark Bill as Failed/Cancelled
        await connection.execute(
            `UPDATE pharmacy_bills SET payment_status = 'Failed' WHERE id = ?`,
            [bill_id]
        );

        await connection.commit();

        res.status(200).json({ success: true, message: 'Bill cancelled and stock restored successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel Bill Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        connection.release();
    }
};

// 9. Fetch Bills List (Clinic isolated)
exports.getBills = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const [bills] = await db.query(
            `SELECT id, bill_number, prescription_id, patient_id, doctor_id, patient_name, doctor_name,
                    subtotal, gst_amount, discount_amount, grand_total, payment_method, payment_status,
                    receipt_number, created_at
             FROM pharmacy_bills
             WHERE clinic_id = ?
             ORDER BY created_at DESC`,
            [clinicId]
        );
        res.status(200).json(bills);
    } catch (error) {
        console.error('Fetch Bills Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 10. Fetch Single Bill Details & Receipt
exports.getBillDetails = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { id } = req.params;

        const [[bill]] = await db.query(
            `SELECT id, bill_number, prescription_id, patient_id, doctor_id, patient_name, doctor_name,
                    subtotal, gst_amount, discount_amount, grand_total, payment_method, payment_status,
                    receipt_number, created_at, razorpay_payment_id
             FROM pharmacy_bills
             WHERE id = ? AND clinic_id = ?`,
            [id, clinicId]
        );

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        const [items] = await db.query(
            `SELECT bi.id, bi.medicine_id, bi.medicine_name, bi.quantity, bi.unit_price, bi.total_price,
                    m.generic_name, m.brand
             FROM pharmacy_bill_items bi
             LEFT JOIN pharmacy_medicines m ON bi.medicine_id = m.id
             WHERE bi.bill_id = ?`,
            [id]
        );

        res.status(200).json({ bill, items });
    } catch (error) {
        console.error('Fetch Bill Details Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 11. Reports & Analytics (Dashboard Stats)
exports.getReports = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;

        // A. Sales and Revenue stats
        const [[salesStats]] = await db.query(
            `SELECT COALESCE(SUM(grand_total), 0) as total_sales,
                    COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN grand_total ELSE 0 END), 0) as today_sales,
                    COUNT(id) as total_bills
             FROM pharmacy_bills
             WHERE clinic_id = ? AND payment_status = 'Paid'`,
            [clinicId]
        );

        // B. Stock Value stats
        const [[stockValueStats]] = await db.query(
            `SELECT COALESCE(SUM(purchase_price * available_quantity), 0) as total_stock_value,
                    COUNT(id) as total_medicines
             FROM pharmacy_medicines
             WHERE clinic_id = ?`,
            [clinicId]
        );

        // C. Low Stock Alerts
        const [lowStockAlerts] = await db.query(
            `SELECT id, medicine_name, available_quantity, min_stock_alert, brand
             FROM pharmacy_medicines
             WHERE clinic_id = ? AND available_quantity <= min_stock_alert
             ORDER BY available_quantity ASC`,
            [clinicId]
        );

        // D. Expiry Alerts (Expiring within next 30 days)
        const [expiryAlerts] = await db.query(
            `SELECT id, medicine_name, expiry_date, available_quantity, batch_number
             FROM pharmacy_medicines
             WHERE clinic_id = ? AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND expiry_date >= CURDATE()
             ORDER BY expiry_date ASC`,
            [clinicId]
        );

        // E. Top Selling Medicines
        const [topSelling] = await db.query(
            `SELECT bi.medicine_name, SUM(bi.quantity) as quantity_sold, SUM(bi.total_price) as total_revenue
             FROM pharmacy_bill_items bi
             JOIN pharmacy_bills b ON bi.bill_id = b.id
             WHERE b.clinic_id = ? AND b.payment_status = 'Paid'
             GROUP BY bi.medicine_name
             ORDER BY quantity_sold DESC
             LIMIT 5`,
            [clinicId]
        );

        // F. Sales trends (last 7 days)
        const [salesTrends] = await db.query(
            `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(grand_total) as revenue
             FROM pharmacy_bills
             WHERE clinic_id = ? AND payment_status = 'Paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY date
             ORDER BY date ASC`,
            [clinicId]
        );

        res.status(200).json({
            sales: salesStats,
            inventoryValue: stockValueStats,
            lowStock: lowStockAlerts,
            expiryAlerts,
            topSelling,
            salesTrends
        });

    } catch (error) {
        console.error('Fetch Pharmacy Reports Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 12. Audit Logs
exports.getAuditLogs = async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT id, user_name, role, ip_address, action, details, created_at
             FROM pharmacy_audit_logs
             ORDER BY created_at DESC
             LIMIT 100`
        );
        res.status(200).json(logs);
    } catch (error) {
        console.error('Fetch Audit Logs Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 13. Search Patients for billing lookup
exports.searchPatients = async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) {
            return res.status(200).json([]);
        }
        const [patients] = await db.query(
            `SELECT p.id, p.name, p.mrn, p.date_of_birth, p.gender, u.phone, p.user_id
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.name LIKE ? OR p.mrn LIKE ? OR u.phone LIKE ?
             LIMIT 10`,
            [`%${search}%`, `%${search}%`, `%${search}%`]
        );
        res.status(200).json(patients);
    } catch (error) {
        console.error('Search Patients Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 14. Get Doctors list for clinic
exports.getDoctors = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const [doctors] = await db.query(
            `SELECT u.id, u.name, s.name as department
             FROM users u
             LEFT JOIN services s ON u.service_id = s.id
             JOIN doctor_schedules ds ON u.id = ds.doctor_id
             WHERE u.role = 'Doctor' AND ds.clinic_id = ?
             GROUP BY u.id, u.name, s.name`,
            [clinicId]
        );
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Get Doctors Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
