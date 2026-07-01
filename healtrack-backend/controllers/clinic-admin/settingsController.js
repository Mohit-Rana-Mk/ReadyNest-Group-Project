const db = require('../../config/db');

exports.getClinicSettings = async (req, res) => {
    const { clinicId } = req.params;
    try {
        const [settings] = await db.query(
            `SELECT name, license_number, address, latitude, longitude, opening_time, closing_time, operational_days 
             FROM clinics WHERE id = ?`,
             [clinicId]
        );
        
        if (settings.length === 0) {
            return res.status(404).json({ message: 'Clinic not found' });
        }
        
        res.status(200).json(settings[0]);
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateClinicSettings = async (req, res) => {
    const { clinicId } = req.params;
    const { name, address, latitude, longitude, opening_time, closing_time, operational_days } = req.body;

    try {
        // Build dynamic query to handle possible missing fields, though we assume all are sent
        let updateQuery = `UPDATE clinics SET name = COALESCE(?, name), address = COALESCE(?, address), 
                           latitude = ?, longitude = ?, opening_time = ?, closing_time = ?, operational_days = ?`;
        let params = [name, address, latitude || null, longitude || null, opening_time || null, closing_time || null, operational_days || null];

        if (latitude && longitude) {
            updateQuery += `, location = ST_GeomFromText(?, 4326)`;
            params.push(`POINT(${longitude} ${latitude})`);
        }

        updateQuery += ` WHERE id = ?`;
        params.push(clinicId);

        await db.execute(updateQuery, params);
        res.status(200).json({ message: 'Clinic settings updated successfully' });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
