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

exports.getOutbreakAlerts = async (req, res) => {
    try {
        const alerts = await clinicAdminService.getOutbreakAlerts(req.params.clinicId);
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        console.error('Outbreak Alerts Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

exports.broadcastOutbreakAlert = async (req, res) => {
    try {
        const { disease, sector, severity, message } = req.body;
        if (!disease || !sector || !severity || !message) {
            return res.status(400).json({ success: false, message: 'Missing required parameters: disease, sector, severity, message' });
        }

        const result = await clinicAdminService.broadcastOutbreakAlert(req.params.clinicId, req.body);

        // Emit WebSocket notification for patient panels
        if (req.io) {
            req.io.emit('NEW_ALERT', {
                title: `Clinic Alert: ${disease} (${severity} Severity)`,
                description: `${message} (Target sector: ${sector})`,
                disease: disease,
                risk_tier: severity,
                confidence: '100%'
            });
        }

        res.status(200).json({
            success: true,
            message: `Outbreak alert successfully broadcasted to ${result.notifiedCount} patients!`,
            data: result
        });
    } catch (error) {
        console.error('Outbreak Broadcast Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

