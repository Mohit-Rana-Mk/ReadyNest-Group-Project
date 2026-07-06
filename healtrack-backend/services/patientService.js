const patientRepository = require('../repositories/patientRepository');

class PatientService {
    async getRecommendations(userId) {
        const patientId = await patientRepository.getPatientIdByUserId(userId);
        if (!patientId) {
            throw new Error('Patient not found');
        }
        return await patientRepository.getPendingRecommendations(patientId);
    }

    async dismissRecommendation(userId, recommendationId) {
        if (isNaN(recommendationId)) {
            return { success: true, message: 'Mock recommendation dismissed' };
        }
        
        const patientId = await patientRepository.getPatientIdByUserId(userId);
        if (!patientId) {
            throw new Error('Patient not found');
        }

        await patientRepository.dismissRecommendation(recommendationId, patientId);
        return { success: true, message: 'Recommendation dismissed' };
    }

    async getServices() {
        return await patientRepository.getServices();
    }

    async getClinicCities() {
        return await patientRepository.getClinicCities();
    }

    async getFamilyMembers(userId) {
        return await patientRepository.getFamilyMembers(userId);
    }

    async addFamilyMember(userId, familyMemberData) {
        const { name, date_of_birth, gender, blood_group } = familyMemberData;
        
        if (!name || !gender) {
            throw new Error('Name and gender are required');
        }
        
        // Generate mock MRN
        const mrn = 'MRN-' + Math.floor(100000 + Math.random() * 900000);
        
        const insertId = await patientRepository.addFamilyMember(
            userId, mrn, name, date_of_birth, gender, blood_group
        );
        
        return { message: 'Family member added successfully', patient_id: insertId };
    }
}

module.exports = new PatientService();
