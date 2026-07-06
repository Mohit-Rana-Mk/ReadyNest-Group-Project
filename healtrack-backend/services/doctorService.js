const doctorRepository = require('../repositories/doctorRepository');

class DoctorService {
    async getAppointments(doctorId, dateFilter = 'today') {
        return await doctorRepository.getAppointments(doctorId, dateFilter);
    }

    async getPatientHistory(patientId) {
        const vitalsHistory = await doctorRepository.getPatientVitals(patientId);
        const prescriptions = await doctorRepository.getPatientPrescriptions(patientId);

        const prescriptionIds = prescriptions.map(p => p.prescription_id);
        const prescriptionItems = await doctorRepository.getPrescriptionItems(prescriptionIds);

        const prescriptionsWithItems = prescriptions.map(pr => {
            return {
                ...pr,
                items: prescriptionItems.filter(item => item.prescription_id === pr.prescription_id)
            };
        });

        return { vitalsHistory, prescriptions: prescriptionsWithItems };
    }

    async completeConsultation(payload) {
        const { appointmentId, patientId, diagnosis } = payload;
        
        if (!appointmentId || !patientId || !diagnosis) {
            throw new Error("Missing required fields: appointmentId, patientId, and diagnosis are required");
        }

        const result = await doctorRepository.completeConsultationTransaction(payload);
        return result;
    }

    async getPatientAnalytics(genders, departments, min_age, max_age) {
        const data = await doctorRepository.getPatientAnalytics(genders, departments, min_age, max_age);
        
        const ageBins = {
            '0': { bin: 0, label: '0', female: 0, male: 0 },
            '20': { bin: 20, label: '20', female: 0, male: 0 },
            '40': { bin: 40, label: '40', female: 0, male: 0 },
            '60': { bin: 60, label: '60', female: 0, male: 0 },
            '80': { bin: 80, label: '80', female: 0, male: 0 }
        };

        data.ageGenderRows.forEach(row => {
            const age = parseInt(row.age);
            const gender = (row.gender || '').toLowerCase();
            let binKey = '0';
            if (age >= 80) binKey = '80';
            else if (age >= 60) binKey = '60';
            else if (age >= 40) binKey = '40';
            else if (age >= 20) binKey = '20';

            if (gender === 'female') {
                ageBins[binKey].female += row.count;
            } else if (gender === 'male') {
                ageBins[binKey].male += row.count;
            }
        });

        return {
            kpis: {
                totalPatients: data.totalPatients,
                repeatPatients: data.repeatPatients
            },
            demographics: data.demographicsRows,
            ageGenderAnalysis: Object.values(ageBins),
            diseaseDistribution: data.diseaseRows
        };
    }
}

module.exports = new DoctorService();
