const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    if (!password || password.length < 6) return false;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

function validateCombinedPhone(phone) {
    if (!phone) return false;
    if (!phone.startsWith('+')) return false;
    const prefixes = ['+91', '+1', '+44', '+61', '+971', '+966'];
    let matchedPrefix = prefixes.find(prefix => phone.startsWith(prefix));
    if (matchedPrefix) {
        const numberPart = phone.slice(matchedPrefix.length).replace(/\D/g, '');
        if (matchedPrefix === '+91' || matchedPrefix === '+1' || matchedPrefix === '+44') {
            return numberPart.length === 10;
        }
        if (matchedPrefix === '+61' || matchedPrefix === '+971' || matchedPrefix === '+966') {
            return numberPart.length === 9;
        }
    }
    const cleanDigits = phone.replace(/\D/g, '');
    return cleanDigits.length >= 7 && cleanDigits.length <= 15;
}


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
            clinic_name: user.clinic_name,
            language: user.language || 'en',
            auth_provider: user.auth_provider || 'local'
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: 'JWT Secret is not configured on the server' });
        }
        const token = jwt.sign(payload, secret, { expiresIn: '24h' });

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

        if (email && !validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format.' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must consist of at least 6 characters, containing 1 uppercase letter, 1 lowercase letter, 1 special character, and 1 numeric value.' 
            });
        }

        if (!validateCombinedPhone(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid phone number format or length for the selected country code.' 
            });
        }


        // Check if phone or email already exists
        const [existing] = await db.query('SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)', [phone, email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone or email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create User
        const [userResult] = await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status, auth_provider) VALUES (?, ?, ?, ?, 'Patient', 'Active', 'local')`,
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
            service_id: null,
            language: 'en',
            auth_provider: 'local'
        };
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: 'JWT Secret is not configured on the server' });
        }
        const token = jwt.sign(payload, secret, { expiresIn: '24h' });

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

        if (admin_email && !validateEmail(admin_email)) {
            return res.status(400).json({ success: false, message: 'Invalid admin email address format.' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must consist of at least 6 characters, containing 1 uppercase letter, 1 lowercase letter, 1 special character, and 1 numeric value.' 
            });
        }

        if (!validateCombinedPhone(admin_phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid admin phone number format or length for the selected country code.' 
            });
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

exports.updateLanguage = async (req, res) => {
    try {
        const { language } = req.body;
        const userId = req.user.id;

        if (!language || !['en', 'hi', 'pa'].includes(language)) {
            return res.status(400).json({ success: false, message: 'Invalid language preference. Allowed: en, hi, pa.' });
        }

        await db.execute('UPDATE users SET language = ? WHERE id = ?', [language, userId]);

        res.json({
            success: true,
            message: 'Language preference updated successfully.',
            data: { language }
        });
    } catch (error) {
        console.error("Update language error:", error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const firebaseAdmin = require('../config/firebase');

exports.firebaseAuth = async (req, res) => {
    try {
        const { idToken, additionalDetails } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Firebase ID Token is required' });
        }

        // Verify the ID token using Firebase Admin SDK
        let decodedToken;
        const isDev = process.env.NODE_ENV === 'development';
        const allowBypass = isDev && process.env.ALLOW_UNVERIFIED_FIREBASE_JWT === 'true';

        if (!firebaseAdmin || !firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
            if (allowBypass) {
                console.warn("Firebase Admin SDK is not initialized. Using manual decode fallback (DEVELOPMENT ONLY).");
                try {
                    const jwt = require('jsonwebtoken');
                    decodedToken = jwt.decode(idToken);
                    if (!decodedToken || !decodedToken.email) {
                        throw new Error("Unable to parse email from token");
                    }
                    console.log("Successfully parsed token in verification fallback mode for user:", decodedToken.email);
                } catch (fallbackError) {
                    return res.status(401).json({ success: false, message: 'Invalid or expired Firebase ID Token' });
                }
            } else {
                return res.status(500).json({ success: false, message: 'Firebase authentication is not configured on the server' });
            }
        } else {
            try {
                decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
            } catch (authError) {
                console.error("Firebase token verification failed via Admin SDK:", authError.message);
                if (allowBypass) {
                    console.log("Attempting to parse ID token manually as development fallback...");
                    try {
                        const jwt = require('jsonwebtoken');
                        decodedToken = jwt.decode(idToken);
                        if (!decodedToken || !decodedToken.email) {
                            throw new Error("Unable to parse email from token");
                        }
                        console.log("Successfully parsed token in verification fallback mode for user:", decodedToken.email);
                    } catch (fallbackError) {
                        return res.status(401).json({ success: false, message: 'Invalid or expired Firebase ID Token' });
                    }
                } else {
                    return res.status(401).json({ success: false, message: 'Invalid or expired Firebase ID Token' });
                }
            }
        }



        const { email, name, uid } = decodedToken;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email address not provided by Firebase provider' });
        }

        // Check if user already exists in local DB
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        if (!user) {
            // User does not exist, let's create a new Patient account
            const displayName = name || additionalDetails?.name || 'Firebase User';
            const phone = additionalDetails?.phone || decodedToken.phone_number || '';
            const dob = additionalDetails?.dob || null;
            const gender = additionalDetails?.gender || 'Prefer Not to Say';
            const bloodGroup = additionalDetails?.blood_group || null;

            if (dob) {
                const birthDate = new Date(dob);
                const today = new Date();
                if (birthDate > today) {
                    return res.status(400).json({ success: false, message: 'Date of birth cannot be a future date.' });
                }
            }

            if (phone) {
                const [existingPhone] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
                if (existingPhone.length > 0) {
                    return res.status(400).json({ success: false, message: 'Phone number already registered with another account.' });
                }
            }

            const dummyPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);

            // 1. Create User
            const [userResult] = await db.execute(
                `INSERT INTO users (name, email, phone, password, role, status, auth_provider) VALUES (?, ?, ?, ?, 'Patient', 'Active', 'google')`,
                [displayName, email, phone, dummyPassword]
            );
            const userId = userResult.insertId;

            // 2. Generate MRN
            const [maxIdResult] = await db.query(`SELECT MAX(id) as maxId FROM patients`);
            const nextId = (maxIdResult[0].maxId || 0) + 1;
            const mrn = `PT-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

            // 3. Create Patient Profile
            await db.execute(
                `INSERT INTO patients (user_id, name, date_of_birth, gender, blood_group, mrn) VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, displayName, dob, gender, bloodGroup, mrn]
            );

            // Re-fetch created user
            const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
            user = newUsers[0];
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ success: false, message: 'Account is suspended' });
        }

        // Generate a local session JWT
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            service_id: user.service_id,
            clinic_id: user.clinic_id,
            language: user.language || 'en',
            auth_provider: user.auth_provider || 'google'
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: 'JWT Secret is not configured on the server' });
        }
        const localToken = jwt.sign(payload, secret, { expiresIn: '24h' });

        res.json({
            success: true,
            message: 'Firebase authentication successful.',
            data: {
                user: payload,
                token: localToken
            }
        });
    } catch (error) {
        console.error("Firebase auth handler error:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.registerPharmacy = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Name, phone, and password are required.' });
        }

        if (email && !validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format.' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must consist of at least 6 characters, containing 1 uppercase letter, 1 lowercase letter, 1 special character, and 1 numeric value.' 
            });
        }

        if (!validateCombinedPhone(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid phone number format or length for the selected country code.' 
            });
        }

        // Check if phone or email already exists
        const [existing] = await db.query('SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)', [phone, email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone or email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        const [userResult] = await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status, auth_provider, clinic_id) 
             VALUES (?, ?, ?, ?, 'Medicine', 'Active', 'local', NULL)`,
            [name, email || null, phone, hashedPassword]
        );
        const userId = userResult.insertId;

        // Generate Token (Auto Login)
        const payload = {
            id: userId,
            name: name,
            email: email,
            role: 'Medicine',
            clinic_id: null,
            language: 'en',
            auth_provider: 'local'
        };
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: 'JWT Secret is not configured on the server' });
        }
        const token = jwt.sign(payload, secret, { expiresIn: '24h' });

        res.status(201).json({
            success: true,
            message: 'Pharmacy registered successfully.',
            data: { user: payload, token }
        });
    } catch (error) {
        console.error("Pharmacy signup error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


