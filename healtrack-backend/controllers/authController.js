const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const [users] = await db.query(`
            SELECT u.*, 
                   COALESCE(u.clinic_id, ds.clinic_id) as resolved_clinic_id,
                   c.name as clinic_name,
                   c.verification_status as clinic_status
            FROM users u
            LEFT JOIN doctor_schedules ds ON ds.doctor_id = u.id
            LEFT JOIN clinics c ON c.id = COALESCE(u.clinic_id, ds.clinic_id)
            WHERE u.email = ?
        `, [email]);
        const user = users[0];

        if (!user) {
            console.log("Login failed: User not found for email:", email);
            return res.status(401).json({ success: false, message: 'Invalid credentials (email not found)' });
        }

        if (user.status !== 'Active') {
            console.log("Login failed: User suspended:", email);
            return res.status(403).json({ success: false, message: 'Account is suspended' });
        }

        if (user.resolved_clinic_id && (user.clinic_status === 'Suspended' || user.clinic_status === 'Pending')) {
            console.log("Login failed: Clinic is suspended/pending:", email);
            return res.status(403).json({ success: false, message: `Your clinic account is currently ${user.clinic_status.toLowerCase()}` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Login failed: Password mismatch for email:", email);
            return res.status(401).json({ success: false, message: 'Invalid credentials (password mismatch)' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            service_id: user.service_id,
            clinic_id: user.resolved_clinic_id,
            clinic_name: user.clinic_name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

        res.json({
            success: true,
            data: {
                user: payload,
                token
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

exports.signupPatient = async (req, res) => {
    try {
        const { name, email, phone, password, dob, gender, blood_group } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Name, phone, and password are required.' });
        }

        // Check if phone or email already exists
        const [existing] = await db.query('SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)', [phone, email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone or email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create User
        const [userResult] = await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, 'Patient', 'Active')`,
            [name, email || null, phone, hashedPassword]
        );
        const userId = userResult.insertId;

        // 2. Generate MRN
        const [maxIdResult] = await db.query(`SELECT MAX(id) as maxId FROM patients`);
        const nextId = (maxIdResult[0].maxId || 0) + 1;
        const mrn = `PT-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

        // 3. Create Patient Profile
        const finalGender = gender || 'Prefer Not to Say';
        await db.execute(
            `INSERT INTO patients (user_id, name, date_of_birth, gender, blood_group, mrn) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, name, dob || null, finalGender, blood_group || null, mrn]
        );

        // 4. Generate Token (Auto Login)
        const payload = {
            id: userId,
            name: name,
            email: email,
            role: 'Patient',
            service_id: null
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully.',
            data: { user: payload, token }
        });
    } catch (error) {
        console.error("Patient signup error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.registerClinic = async (req, res) => {
    try {
        const { clinic_name, license_number, address, city, postal_code, admin_name, admin_email, admin_phone, password } = req.body;

        if (!clinic_name || !license_number || !admin_name || !admin_phone || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // Check if admin phone/email exists
        const [existingUser] = await db.query('SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)', [admin_phone, admin_email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Admin phone or email already registered.' });
        }

        // Check if clinic license exists
        const [existingClinic] = await db.query('SELECT id FROM clinics WHERE license_number = ?', [license_number]);
        if (existingClinic.length > 0) {
            return res.status(400).json({ success: false, message: 'Clinic license number already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction start
        await db.query('START TRANSACTION');

        // 1. Create Clinic (Pending)
        const [clinicResult] = await db.execute(
            `INSERT INTO clinics (name, license_number, address, city, postal_code, verification_status) 
             VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [clinic_name, license_number, address || '', city || '', postal_code || '']
        );
        const clinicId = clinicResult.insertId;

        // 2. Create Clinic Admin User (Suspended until approved)
        const [userResult] = await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status, clinic_id) VALUES (?, ?, ?, ?, 'ClinicAdmin', 'Suspended', ?)`,
            [admin_name, admin_email || null, admin_phone, hashedPassword, clinicId]
        );
        
        await db.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Clinic registered successfully. Awaiting Super Admin approval.'
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Clinic registration error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
