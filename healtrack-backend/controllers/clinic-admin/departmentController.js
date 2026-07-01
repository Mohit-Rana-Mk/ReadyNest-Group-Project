const db = require('../../config/db');

exports.getDepartments = async (req, res) => {
    const { clinicId } = req.params;
    try {
        // JOIN clinic_services and services
        const [departments] = await db.query(
            `SELECT s.id, s.name, cs.consultation_fee 
             FROM clinic_services cs
             JOIN services s ON cs.service_id = s.id
             WHERE cs.clinic_id = ?`,
             [clinicId]
        );
        res.status(200).json(departments);
    } catch (error) {
        console.error('Departments Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.addDepartment = async (req, res) => {
    const { clinicId } = req.params;
    let { service_id, consultation_fee, custom_service_name } = req.body;
    
    if ((!service_id && !custom_service_name) || !consultation_fee) {
        return res.status(400).json({ message: 'service_id/custom_service_name and consultation_fee are required' });
    }

    try {
        if (service_id === 'custom' && custom_service_name) {
            // Create a new global service
            const [result] = await db.execute(
                `INSERT INTO services (name) VALUES (?)`,
                [custom_service_name]
            );
            service_id = result.insertId;
        }

        await db.execute(
            `INSERT INTO clinic_services (clinic_id, service_id, consultation_fee) 
             VALUES (?, ?, ?)`,
             [clinicId, service_id, consultation_fee]
        );
        res.status(201).json({ message: 'Department added to clinic successfully' });
    } catch (error) {
        console.error('Add Department Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateDepartment = async (req, res) => {
    const { clinicId, serviceId } = req.params;
    const { consultation_fee } = req.body;

    try {
        await db.execute(
            `UPDATE clinic_services SET consultation_fee = ? WHERE clinic_id = ? AND service_id = ?`,
            [consultation_fee, clinicId, serviceId]
        );
        res.status(200).json({ message: 'Department fee updated' });
    } catch (error) {
        console.error('Update Department Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteDepartment = async (req, res) => {
    const { clinicId, serviceId } = req.params;

    try {
        await db.execute(
            `DELETE FROM clinic_services WHERE clinic_id = ? AND service_id = ?`,
            [clinicId, serviceId]
        );
        res.status(200).json({ message: 'Department removed from clinic' });
    } catch (error) {
        console.error('Delete Department Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getAllGlobalServices = async (req, res) => {
    try {
        const [services] = await db.query(`SELECT id, name FROM services`);
        res.status(200).json(services);
    } catch (error) {
        console.error('Global Services Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
