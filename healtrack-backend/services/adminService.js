const adminRepository = require('../repositories/adminRepository');

class AdminService {
    async getPendingClinics() {
        return await adminRepository.getPendingClinics();
    }

    async verifyClinic(payload) {
        const { clinicId, status } = payload;
        
        if (!clinicId || !['Approved', 'Delisted', 'Suspended'].includes(status)) {
            throw new Error("Invalid clinicId or status parameter");
        }

        await adminRepository.updateClinicVerificationStatus(clinicId, status);
        return { success: true, message: `Clinic status successfully updated to ${status}!` };
    }

    async createClinic(payload) {
        const { name, license_number, address, city, postal_code, latitude, longitude } = payload;

        if (!name || !license_number || !address || !city || !postal_code) {
            throw new Error("Missing required clinic information.");
        }

        const latVal = latitude ? parseFloat(latitude) : 0.0;
        const lngVal = longitude ? parseFloat(longitude) : 0.0;

        await adminRepository.createClinic(name, license_number, address, city, postal_code, latVal, lngVal);
        return { success: true, message: "Clinic successfully onboarded and set to Approved!" };
    }

    async getEpidemiologyTrends(daysQuery) {
        const days = parseInt(daysQuery) || 30;
        const locations = await adminRepository.getEpidemiologyLocations(days);
        const trends = await adminRepository.getEpidemiologyTrends(days);

        return { locations, trends };
    }

    async getAiSystemHealth() {
        const triageStats = await adminRepository.getAiTriageStats();
        const preventiveRecsSent = await adminRepository.getPreventiveRecommendationsCount();

        const riskMap = { Low: 0, Medium: 0, High: 0 };
        triageStats.forEach(row => {
            if (riskMap[row.predicted_risk] !== undefined) {
                riskMap[row.predicted_risk] = row.count;
            }
        });

        return {
            triageRiskRatios: riskMap,
            preventiveRecsSent: preventiveRecsSent || 0
        };
    }

    async getEcosystemKpis() {
        const counts = await adminRepository.getEcosystemCounts();
        const reviews = await adminRepository.getClinicReviews();

        return {
            kpis: counts,
            reviews: reviews.map(r => ({
                ...r,
                rating: r.rating ? parseFloat(parseFloat(r.rating).toFixed(1)) : 0
            }))
        };
    }
}

module.exports = new AdminService();
