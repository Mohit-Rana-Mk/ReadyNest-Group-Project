const db = require('../../config/db');
const clinicAdminService = require('../../services/clinicAdminService');

exports.getStaff = async (req, res) => {
    try {
        const staff = await clinicAdminService.getStaff(req.params.clinicId);
        res.status(200).json(staff);
    } catch (error) {
        console.error('Staff Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.addStaff = async (req, res) => {
    try {
        const result = await clinicAdminService.addStaff(req.params.clinicId, req.body);
        res.status(201).json({ message: 'Staff added successfully', ...result });
    } catch (error) {
        if (error.message === 'Missing required fields') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Add Staff Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A user with this email or phone number already exists.' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        await clinicAdminService.updateStaff(staffId, req.body);
        res.status(200).json({ message: 'Staff updated successfully' });
    } catch (error) {
        console.error('Update Staff Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
