const jwt = require('jsonwebtoken');

const payload = {
    id: 1,
    name: 'Admin',
    email: 'superadmin@healtrack.com',
    role: 'SuperAdmin',
    service_id: null,
    clinic_id: null
};

const token = jwt.sign(payload, 'secret', { expiresIn: '24h' });
console.log("Token:", token);

// Simulate frontend atob
const base64Url = token.split('.')[1];
try {
    const decodedStr = Buffer.from(base64Url, 'base64').toString('utf8');
    const user = JSON.parse(decodedStr);
    console.log("Decoded user:", user);
    console.log("Role:", user.role);
    console.log("Is role SuperAdmin?", user.role === 'SuperAdmin');
    console.log("Is it in ['SuperAdmin']?", ['SuperAdmin'].includes(user.role));
} catch (e) {
    console.error("Error:", e);
}
