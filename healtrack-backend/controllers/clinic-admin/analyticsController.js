const db = require('../../config/db');
const clinicAdminService = require('../../services/clinicAdminService');

exports.getAnalytics = async (req, res) => {
    try {
        const { clinicId } = req.params;
        const months = parseInt(req.query.months) || 6;
        
        const data = await clinicAdminService.getAnalytics(clinicId, months);
        res.status(200).json(data);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getOperationalDashboard = async (req, res) => {
    try {
        const { clinicId } = req.params;
        const data = await clinicAdminService.getOperationalDashboard(clinicId, req.query);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        console.error('Operational Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};
