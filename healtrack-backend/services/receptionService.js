const receptionRepository = require('../repositories/receptionRepository');

class ReceptionService {
    async getQueue(clinicId) {
        const today = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(today.getTime() + istOffset);
        const dateString = istDate.toISOString().split('T')[0];

        const queue = await receptionRepository.getQueue(clinicId, dateString);
        const doctors = await receptionRepository.getActiveDoctors(clinicId);

        const activeDoctors = doctors.length;
        
        const checkedInCount = queue.filter(app => app.status === 'Checked-In').length;
        let avgWaitTime = "0 mins";
        
        if (checkedInCount > 0) {
            if (activeDoctors > 0) {
                const waitTime = Math.ceil((checkedInCount / activeDoctors) * 15);
                avgWaitTime = `${waitTime} mins`;
            } else {
                avgWaitTime = "60+ mins";
            }
        } else {
            avgWaitTime = "5 mins";
        }

        return { queue, doctors, activeDoctors, avgWaitTime };
    }

    async checkIn(clinicId, appointmentId) {
        await receptionRepository.checkInPatient(appointmentId, clinicId);
    }

    async updateStatus(clinicId, appointmentId, status) {
        if (!status) throw new Error('Status is required');
        await receptionRepository.updateStatus(appointmentId, clinicId, status);
    }

    async lookupPatient(phone) {
        if (!phone) throw new Error('Phone is required');
        return await receptionRepository.lookupPatientByPhone(phone);
    }

    async registerWalkIn(clinicId, payload) {
        const { doctor_id, patient_id, new_patient_name } = payload;
        
        if (!doctor_id) {
            throw new Error('doctor_id is required');
        }

        if (!patient_id && !new_patient_name) {
            throw new Error('Name is required for new patient');
        }

        await receptionRepository.registerWalkIn(clinicId, payload);
    }
}

module.exports = new ReceptionService();
