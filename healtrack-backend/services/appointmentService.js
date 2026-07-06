const appointmentRepository = require('../repositories/appointmentRepository');
const crypto = require('crypto');

class AppointmentService {
    async getAppointments(patientId) {
        return await appointmentRepository.getAppointmentsByPatientId(patientId);
    }

    async getFamilyAppointments(userId) {
        return await appointmentRepository.getFamilyAppointmentsByUserId(userId);
    }

    async bookAppointment(bookingData) {
        const { clinic_id, doctor_id, patient_id, appointment_date, consultation_type } = bookingData;
        
        if (!clinic_id || !doctor_id || !patient_id || !appointment_date) {
            const missing = [];
            if (!clinic_id) missing.push('clinic_id');
            if (!doctor_id) missing.push('doctor_id');
            if (!patient_id) missing.push('patient_id');
            if (!appointment_date) missing.push('appointment_date');
            throw new Error(`Missing required booking fields: ${missing.join(', ')}`);
        }

        const cType = consultation_type === 'Teleconsultation' ? 'Teleconsultation' : 'In-Person';
        let meetingLink = null;
        if (cType === 'Teleconsultation') {
            meetingLink = `https://meet.jit.si/HealTrack_${crypto.randomUUID()}`;
        }

        await appointmentRepository.createAppointment(
            clinic_id, doctor_id, patient_id, appointment_date, cType, meetingLink
        );

        return { clinicId: clinic_id }; // Return clinicId so controller can emit socket event
    }

    async cancelAppointment(appointmentId) {
        await appointmentRepository.cancelAppointment(appointmentId);
    }

    async rescheduleAppointment(appointmentId, newDate) {
        if (!newDate) {
            throw new Error('New date is required');
        }
        await appointmentRepository.rescheduleAppointment(appointmentId, newDate);
    }
}

module.exports = new AppointmentService();
