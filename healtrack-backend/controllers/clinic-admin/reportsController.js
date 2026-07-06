const db = require('../../config/db');
const clinicAdminService = require('../../services/clinicAdminService');

exports.getLogs = async (req, res) => {
    try {
        const logs = await clinicAdminService.getLogs(req.params.clinicId);
        res.status(200).json(logs);
    } catch (error) {
        console.error('Fetch Logs Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getFinancialReport = async (req, res) => {
    try {
        const report = await clinicAdminService.getFinancialReport(req.params.clinicId);
        res.status(200).json(report);
    } catch (error) {
        console.error('Fetch Financial Report Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
