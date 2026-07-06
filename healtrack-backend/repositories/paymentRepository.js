const db = require('../config/db');

class PaymentRepository {
    async getDoctorFee(clinicId, doctorId) {
        const [feeRows] = await db.query(
            `SELECT COALESCE(cs.consultation_fee, 500.00) AS fee 
             FROM users u 
             LEFT JOIN clinic_services cs ON u.service_id = cs.service_id AND cs.clinic_id = ?
             WHERE u.id = ? AND u.role = 'Doctor'`,
            [clinicId, doctorId]
        );
        return feeRows.length > 0 ? parseFloat(feeRows[0].fee) : 500.00;
    }

    async createPendingAppointment(clinicId, doctorId, patientId, appointmentDate, cType, meetingLink) {
        const [appResult] = await db.execute(
            `INSERT INTO appointments (clinic_id, doctor_id, patient_id, appointment_date, status, booking_source, consultation_type, meeting_link)
             VALUES (?, ?, ?, ?, 'Pending Payment', 'App', ?, ?)`,
            [clinicId, doctorId, patientId, appointmentDate, cType, meetingLink]
        );
        return appResult.insertId;
    }

    async createRazorpayOrderRecord(appointmentId, orderId, amount) {
        await db.execute(
            `INSERT INTO razorpay_orders (appointment_id, order_id, amount, status)
             VALUES (?, ?, ?, 'created')`,
            [appointmentId, orderId, amount]
        );
    }

    async createInitialPaymentRecord(patientId, doctorId, clinicId, appointmentId, orderId, amount, receiptId, invoiceId) {
        await db.execute(
            `INSERT INTO payments (patient_id, doctor_id, clinic_id, appointment_id, razorpay_order_id, amount, status, receipt_id, invoice_id)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
            [patientId, doctorId, clinicId, appointmentId, orderId, amount, receiptId, invoiceId]
        );
    }

    async markPaymentFailed(appointmentId) {
        await db.execute(
            `UPDATE payments SET status = 'Failed' WHERE appointment_id = ?`,
            [appointmentId]
        );
    }

    async getPaymentByAppointmentId(appointmentId) {
        const [paymentRows] = await db.query(
            `SELECT id, status, clinic_id FROM payments WHERE appointment_id = ?`,
            [appointmentId]
        );
        return paymentRows.length > 0 ? paymentRows[0] : null;
    }

    async verifyPaymentAndConfirmAppointment(appointmentId, paymentId, signature, orderId, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE appointments SET status = 'Confirmed' WHERE id = ?`,
                [appointmentId]
            );

            await connection.execute(
                `UPDATE payments 
                 SET status = 'Paid', razorpay_payment_id = ?, razorpay_signature = ? 
                 WHERE appointment_id = ?`,
                [paymentId, signature, appointmentId]
            );

            await connection.execute(
                `UPDATE razorpay_orders SET status = 'paid' WHERE order_id = ?`,
                [orderId]
            );

            await connection.execute(
                `INSERT INTO payment_audit_logs (user_id, action, details)
                 VALUES (?, 'PAYMENT_VERIFIED', ?)`,
                [userId || null, JSON.stringify({ appointment_id: appointmentId, razorpay_payment_id: paymentId, razorpay_order_id: orderId })]
            );

            await connection.commit();
        } catch (trxErr) {
            await connection.rollback();
            throw trxErr;
        } finally {
            connection.release();
        }
    }

    async getPatientIdByUserId(userId) {
        const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        return patientRows.length > 0 ? patientRows[0].id : null;
    }

    async getPatientPayments(patientId) {
        const [payments] = await db.query(
            `SELECT p.id, p.amount, p.status, p.receipt_id, p.invoice_id, p.created_at, p.razorpay_payment_id,
                    c.name AS clinic_name, du.name AS doctor_name, a.appointment_date,
                    a.id AS appointment_id,
                    rr.status AS refund_status
             FROM payments p
             JOIN clinics c ON p.clinic_id = c.id
             JOIN users du ON p.doctor_id = du.id
             JOIN appointments a ON p.appointment_id = a.id
             LEFT JOIN refund_requests rr ON p.id = rr.payment_id
             WHERE p.patient_id = ?
             ORDER BY p.created_at DESC`,
            [patientId]
        );
        return payments;
    }

    async getPaymentDetails(paymentId) {
        const [rows] = await db.query(
            `SELECT p.id, p.amount, p.status, p.receipt_id, p.invoice_id, p.created_at, p.razorpay_payment_id, p.razorpay_order_id,
                    c.name AS clinic_name, c.address AS clinic_address, c.city AS clinic_city, c.license_number AS clinic_license,
                    du.name AS doctor_name, 
                    pat.name AS patient_name, pat.mrn AS patient_mrn,
                    a.appointment_date, a.consultation_type
             FROM payments p
             JOIN clinics c ON p.clinic_id = c.id
             JOIN users du ON p.doctor_id = du.id
             JOIN patients pat ON p.patient_id = pat.id
             JOIN appointments a ON p.appointment_id = a.id
             WHERE p.id = ?`,
            [paymentId]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    async getPaymentByIdAndPatient(paymentId, patientId) {
        const [paymentRows] = await db.query(
            `SELECT id, amount, status FROM payments WHERE id = ? AND patient_id = ?`,
            [paymentId, patientId]
        );
        return paymentRows.length > 0 ? paymentRows[0] : null;
    }

    async checkExistingRefund(paymentId) {
        const [existingRefund] = await db.query(`SELECT id FROM refund_requests WHERE payment_id = ?`, [paymentId]);
        return existingRefund.length > 0;
    }

    async createRefundRequest(paymentId, amount, reason) {
        await db.execute(
            `INSERT INTO refund_requests (payment_id, amount, reason, status)
             VALUES (?, ?, ?, 'Pending')`,
            [paymentId, amount, reason]
        );
    }
}

module.exports = new PaymentRepository();
