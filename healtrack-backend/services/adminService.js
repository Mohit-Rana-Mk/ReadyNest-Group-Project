const adminRepository = require('../repositories/adminRepository');
const db = require('../config/db');


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
        const { 
            name, license_number, address, city, postal_code, latitude, longitude,
            admin_name, admin_email, admin_phone, admin_password 
        } = payload;

        if (!name || !license_number || !address || !city || !postal_code) {
            throw new Error("Missing required clinic information.");
        }

        const latVal = latitude ? parseFloat(latitude) : 0.0;
        const lngVal = longitude ? parseFloat(longitude) : 0.0;

        let adminData = null;
        let generatedPassword = null;
        if (admin_email) {
            if (!admin_name || !admin_phone) {
                throw new Error("Admin name and phone number are required to create a clinic admin account.");
            }
            
            // Check if email already exists in users table
            const [existing] = await db.query("SELECT id FROM users WHERE email = ? OR phone = ?", [admin_email, admin_phone]);
            if (existing && existing.length > 0) {
                throw new Error("A user account with this email or phone already exists.");
            }

            const bcrypt = require('bcrypt');
            generatedPassword = admin_password || Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);
            adminData = { admin_name, admin_email, admin_phone, hashedPassword };
        }

        await adminRepository.createClinic(
            { name, license_number, address, city, postal_code, latitude: latVal, longitude: lngVal },
            adminData
        );

        return { 
            success: true, 
            message: admin_email 
                ? `Clinic successfully onboarded and Admin account created!` 
                : "Clinic successfully onboarded and set to Approved!",
            credentials: admin_email ? { email: admin_email, password: generatedPassword } : null
        };
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

    async getAllPatients() {
        return await adminRepository.getAllPatients();
    }

    async updatePatientStatus(userId, status) {
        if (!userId || !['Active', 'Suspended'].includes(status)) {
            throw new Error("Invalid userId or status parameter");
        }
        await adminRepository.updatePatientStatus(userId, status);
    }

    async deletePatient(patientId) {
        if (!patientId) {
            throw new Error("Invalid patientId parameter");
        }
        await adminRepository.deletePatient(patientId);
    }

    async deleteClinic(clinicId) {
        if (!clinicId) {
            throw new Error("Invalid clinicId parameter");
        }
        await adminRepository.deleteClinic(clinicId);
    }

    async getClinicDetails(clinicId) {
        if (!clinicId) throw new Error("Clinic ID is required");
        return await adminRepository.getClinicDetails(clinicId);
    }

    async updateClinicDetails(clinicId, details) {
        if (!clinicId || !details.name || !details.license_number) {
            throw new Error("Missing required clinic details");
        }
        await adminRepository.updateClinicDetails(clinicId, details);
    }

    async addClinicDepartment(clinicId, serviceId, fee) {
        if (!clinicId || !serviceId || fee === undefined) {
            throw new Error("Missing parameters for adding department");
        }
        await adminRepository.addClinicDepartment(clinicId, serviceId, fee);
    }

    async removeClinicDepartment(clinicId, serviceId) {
        if (!clinicId || !serviceId) {
            throw new Error("Missing parameters for removing department");
        }
        await adminRepository.removeClinicDepartment(clinicId, serviceId);
    }

    async updateUserStatus(userId, status) {
        if (!userId || !['Active', 'Suspended'].includes(status)) {
            throw new Error("Invalid status update parameters");
        }
        await adminRepository.updateUserStatus(userId, status);
    }

    async deleteUser(userId) {
        if (!userId) throw new Error("User ID is required");
        await adminRepository.deleteUser(userId);
    }
}

module.exports = new AdminService();
