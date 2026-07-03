const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 5, role: 'Patient' }, 'super_secret_jwt_key', { expiresIn: '1d' });

const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/patient/recommendations',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, body));
});
req.on('error', console.error);
req.end();
