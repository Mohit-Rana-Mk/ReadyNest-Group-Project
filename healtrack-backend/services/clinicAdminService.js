const clinicAdminRepository = require('../repositories/clinicAdminRepository');

class ClinicAdminService {
    async getAnalytics(clinicId, months) {
        return await clinicAdminRepository.getBasicAnalytics(clinicId, months);
    }

    async getOperationalDashboard(clinicId, filters) {
        const data = await clinicAdminRepository.getOperationalDashboardStats(clinicId, filters);
        
        const totalRevenue = parseFloat(data.kpi.totalRevenue || 0);
        const totalAppointments = parseInt(data.kpi.totalAppointments || 0);
        const cancelledAppointments = parseInt(data.kpi.cancelledAppointments || 0);
        const totalDoctors = parseInt(data.kpi.totalDoctors || 0);

        const noShowRate = totalAppointments > 0 
            ? ((cancelledAppointments / totalAppointments) * 100).toFixed(2) 
            : '0.00';

        return {
            kpis: {
                noShowRate: parseFloat(noShowRate),
                totalAppointments,
                totalRevenue,
                totalDoctors,
                repeatPatients: parseInt(data.repeatPatients)
            },
            doctorUtilization: data.utilizationRows,
            revenueOverview: data.revenueRows,
            peakHours: data.peakHoursRows.map(r => ({ hour: `${r.hour}:00`, count: r.count })),
            appointmentsOverview: data.deptRows
        };
    }

    async getDepartments(clinicId) {
        return await clinicAdminRepository.getDepartments(clinicId);
    }

    async addDepartment(clinicId, payload) {
        let { service_id, consultation_fee, custom_service_name } = payload;
        
        if ((!service_id && !custom_service_name) || !consultation_fee) {
            throw new Error('service_id/custom_service_name and consultation_fee are required');
        }

        if (service_id === 'custom' && custom_service_name) {
            const existingId = await clinicAdminRepository.getServiceByName(custom_service_name);
            if (existingId) {
                service_id = existingId;
            } else {
                service_id = await clinicAdminRepository.createGlobalService(custom_service_name);
            }
        }

        await clinicAdminRepository.addClinicDepartment(clinicId, service_id, consultation_fee);
    }

    async updateDepartment(clinicId, serviceId, consultation_fee) {
        await clinicAdminRepository.updateClinicDepartment(clinicId, serviceId, consultation_fee);
    }

    async deleteDepartment(clinicId, serviceId) {
        await clinicAdminRepository.deleteClinicDepartment(clinicId, serviceId);
    }

    async getAllGlobalServices() {
        return await clinicAdminRepository.getAllGlobalServices();
    }

    async getOperations(clinicId) {
        const today = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(today.getTime() + istOffset);
        const dateString = istDate.toISOString().split('T')[0];

        return await clinicAdminRepository.getOperations(clinicId, dateString);
    }

    async getLogs(clinicId) {
        const { apptLogs, deptLogs } = await clinicAdminRepository.getLogs(clinicId);
        
        let allLogs = [...apptLogs, ...deptLogs];
        allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return allLogs.slice(0, 15);
    }

    async getFinancialReport(clinicId) {
        return await clinicAdminRepository.getFinancialReport(clinicId);
    }

    async getSettings(clinicId) {
        const settings = await clinicAdminRepository.getSettings(clinicId);
        if (settings.length === 0) {
            throw new Error('Clinic not found');
        }
        return settings[0];
    }

    async updateSettings(clinicId, settingsData) {
        await clinicAdminRepository.updateSettings(clinicId, settingsData);
    }

    async getStaff(clinicId) {
        return await clinicAdminRepository.getStaff(clinicId);
    }

    async addStaff(clinicId, payload) {
        const { name, email, phone, role, service_id, password } = payload;
        
        if (!name || !email || !phone || !role || (role === 'Doctor' && !service_id)) {
            throw new Error('Missing required fields');
        }

        const bcrypt = require('bcrypt');
        const generatedPassword = password || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const newUserId = await clinicAdminRepository.addStaffMember({
            name, email, phone, role, service_id, hashedPassword, clinicId
        });

        return { id: newUserId, credentials: { email, password: generatedPassword } };
    }

    async updateStaff(staffId, payload) {
        await clinicAdminRepository.updateStaffMember(staffId, payload);
    }

    async getOutbreakAlerts(clinicId) {
        return await clinicAdminRepository.getOutbreakAlerts(clinicId);
    }

    async broadcastOutbreakAlert(clinicId, payload) {
        return await clinicAdminRepository.createOutbreakAlert(clinicId, payload);
    }
}

module.exports = new ClinicAdminService();
