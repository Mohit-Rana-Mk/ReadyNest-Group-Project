const db = require('../../config/db');
const clinicAdminService = require('../../services/clinicAdminService');

exports.getDepartments = async (req, res) => {
    try {
        const departments = await clinicAdminService.getDepartments(req.params.clinicId);
        res.status(200).json(departments);
    } catch (error) {
        console.error('Departments Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.addDepartment = async (req, res) => {
    try {
        await clinicAdminService.addDepartment(req.params.clinicId, req.body);
        res.status(201).json({ message: 'Department added to clinic successfully' });
    } catch (error) {
        if (error.message === 'service_id/custom_service_name and consultation_fee are required') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Add Department Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'This department already exists.' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { clinicId, serviceId } = req.params;
        await clinicAdminService.updateDepartment(clinicId, serviceId, req.body.consultation_fee);
        res.status(200).json({ message: 'Department fee updated' });
    } catch (error) {
        console.error('Update Department Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const { clinicId, serviceId } = req.params;
        await clinicAdminService.deleteDepartment(clinicId, serviceId);
        res.status(200).json({ message: 'Department removed from clinic' });
    } catch (error) {
        console.error('Delete Department Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getAllGlobalServices = async (req, res) => {
    try {
        const services = await clinicAdminService.getAllGlobalServices();
        res.status(200).json(services);
    } catch (error) {
        console.error('Global Services Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
