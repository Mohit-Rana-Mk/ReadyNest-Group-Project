const db = require('../../config/db');

exports.getStaff = async (req, res) => {
    const { clinicId } = req.params;
    try {
        // Fetch staff assigned to this clinic. JOIN doctor_schedules for doctors.
        const [staff] = await db.query(
            `SELECT u.id, u.name, u.role, u.status, s.name as department, u.service_id
             FROM users u
             LEFT JOIN doctor_schedules ds ON u.id = ds.doctor_id
             LEFT JOIN services s ON u.service_id = s.id
             WHERE u.role IN ('Doctor', 'ClinicStaff') 
             AND (ds.clinic_id = ? OR u.role = 'ClinicStaff')
             GROUP BY u.id, u.name, u.role, u.status, s.name, u.service_id`,
             [clinicId]
        );
        res.status(200).json(staff);
    } catch (error) {
        console.error('Staff Fetch Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.addStaff = async (req, res) => {
    const { clinicId } = req.params;
    const { name, email, phone, role, service_id } = req.body;
    
    if (!name || !email || !phone || !role || (role === 'Doctor' && !service_id)) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status, service_id) VALUES (?, ?, ?, ?, ?, 'Active', ?)`,
            [name, email, phone, 'password123', role, role === 'Doctor' ? service_id : null]
        );
        const newUserId = result.insertId;

        // If Doctor, link them to this clinic with a default schedule to map them
        if (role === 'Doctor') {
            await db.execute(
                `INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time) VALUES (?, ?, 'Monday', '09:00:00', '17:00:00')`,
                [newUserId, clinicId]
            );
        }
        res.status(201).json({ message: 'Staff added successfully', id: newUserId });
    } catch (error) {
        console.error('Add Staff Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateStaff = async (req, res) => {
    const { staffId } = req.params;
    const { name, role, status, service_id } = req.body;

    try {
        await db.execute(
            `UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), status = COALESCE(?, status), service_id = CASE WHEN ? = 'Doctor' THEN COALESCE(?, service_id) ELSE NULL END WHERE id = ?`,
            [name, role, status, role, service_id, staffId]
        );
        res.status(200).json({ message: 'Staff updated successfully' });
    } catch (error) {
        console.error('Update Staff Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
