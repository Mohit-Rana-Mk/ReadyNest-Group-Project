const paymentRepository = require('../repositories/paymentRepository');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

class PaymentService {
    async createOrder(payload) {
        const { clinic_id, doctor_id, patient_id, appointment_date, consultation_type, payment_method } = payload;

        if (!clinic_id || !doctor_id || !patient_id || !appointment_date) {
            throw new Error('Missing required fields for appointment booking');
        }

        const fee = await paymentRepository.getDoctorFee(clinic_id, doctor_id);

        const cType = consultation_type || 'In-Person';
        let meetingLink = null;
        if (cType === 'Teleconsultation') {
            meetingLink = `/video/${crypto.randomUUID()}`;
        }

        const appointmentId = await paymentRepository.createPendingAppointment(
            clinic_id, doctor_id, patient_id, appointment_date, cType, meetingLink
        );

        if (payment_method === 'Counter') {
            const orderId = `COUNTER-${appointmentId}`;
            const receipt_id = `REC-CNT-${Date.now()}-${appointmentId}`;
            const invoice_id = `INV-CNT-${Date.now()}-${appointmentId}`;

            await paymentRepository.createInitialPaymentRecord(
                patient_id, doctor_id, clinic_id, appointmentId, orderId, fee, receipt_id, invoice_id
            );

            await paymentRepository.confirmCounterAppointment(appointmentId);

            return {
                appointmentId,
                paymentMethod: 'Counter',
                fee
            };
        }

        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(fee * 100), 
            currency: 'INR',
            receipt: `receipt_apt_${appointmentId}`
        });

        await paymentRepository.createRazorpayOrderRecord(appointmentId, rzpOrder.id, fee);

        const receipt_id = `REC-${Date.now()}-${appointmentId}`;
        const invoice_id = `INV-${Date.now()}-${appointmentId}`;
        
        await paymentRepository.createInitialPaymentRecord(
            patient_id, doctor_id, clinic_id, appointmentId, rzpOrder.id, fee, receipt_id, invoice_id
        );

        return {
            appointmentId,
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        };
    }

    async verifyPayment(payload, userId) {
        const { appointment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = payload;

        if (!appointment_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            throw new Error('Missing payment verification tokens');
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            throw new Error('Razorpay API Key Secret is not configured on the server');
        }
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            await paymentRepository.markPaymentFailed(appointment_id);
            throw new Error('Invalid payment signature verification');
        }

        const payment = await paymentRepository.getPaymentByAppointmentId(appointment_id);

        if (!payment) {
            throw new Error('Payment record not found');
        }

        if (payment.status === 'Paid') {
            return { alreadyProcessed: true, clinicId: payment.clinic_id };
        }

        await paymentRepository.verifyPaymentAndConfirmAppointment(
            appointment_id, razorpay_payment_id, razorpay_signature, razorpay_order_id, userId
        );

        return { alreadyProcessed: false, clinicId: payment.clinic_id };
    }
    
    async getPatientPayments(userId) {
        const patientId = await paymentRepository.getPatientIdByUserId(userId);
        if (!patientId) {
            throw new Error('Patient profile not found');
        }
        return await paymentRepository.getPatientPayments(patientId);
    }

    async getPaymentDetails(paymentId, userId, userRole) {
        const details = await paymentRepository.getPaymentDetails(paymentId);
        if (!details) {
            throw new Error('Payment record not found');
        }
        if (userRole === 'Patient') {
            const patientId = await paymentRepository.getPatientIdByUserId(userId);
            if (!patientId || details.patient_id !== patientId) {
                throw new Error('Unauthorized access to payment details');
            }
        }
        return details;
    }

    async requestRefund(userId, payload) {
        const { payment_id, reason } = payload;
        if (!payment_id || !reason) {
            throw new Error('Payment ID and reason are required');
        }

        const patientId = await paymentRepository.getPatientIdByUserId(userId);
        if (!patientId) {
            throw new Error('Patient not found');
        }

        const payment = await paymentRepository.getPaymentByIdAndPatient(payment_id, patientId);
        if (!payment) {
            throw new Error('Payment not found or unauthorized');
        }

        if (payment.status !== 'Paid') {
            throw new Error('Only successful paid payments can be refunded');
        }

        const hasExistingRefund = await paymentRepository.checkExistingRefund(payment_id);
        if (hasExistingRefund) {
            throw new Error('Refund request already submitted for this payment');
        }

        await paymentRepository.createRefundRequest(payment_id, payment.amount, reason);
        return { success: true, message: 'Refund request submitted successfully' };
    }
}

module.exports = new PaymentService();
