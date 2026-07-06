const db = require('../../config/db');
const clinicAdminService = require('../../services/clinicAdminService');

exports.getClinicSettings = async (req, res) => {
    try {
        const settings = await clinicAdminService.getSettings(req.params.clinicId);
        res.status(200).json(settings);
    } catch (error) {
        if (error.message === 'Clinic not found') {
            return res.status(404).json({ message: error.message });
        }
        console.error('Fetch Settings Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateClinicSettings = async (req, res) => {
    try {
        const { clinicId } = req.params;
        await clinicAdminService.updateSettings(clinicId, req.body);
        res.status(200).json({ message: 'Clinic settings updated successfully' });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
