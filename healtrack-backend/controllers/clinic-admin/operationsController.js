const db = require('../../config/db');
const clinicAdminService = require('../../services/clinicAdminService');

exports.getOperations = async (req, res) => {
    try {
        const operations = await clinicAdminService.getOperations(req.params.clinicId);
        res.status(200).json(operations);
    } catch (error) {
        console.error('Operations Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
