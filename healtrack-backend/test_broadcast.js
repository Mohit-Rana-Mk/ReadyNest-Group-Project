const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, role: 'SuperAdmin' }, 'super_secret_jwt_key', { expiresIn: '1d' });
const data = JSON.stringify({
    disease: 'Test',
    title: 'Test Broadcast',
    description: 'Testing 123'
});

const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/admin/broadcast-awareness',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': data.length
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log(body));
});
req.on('error', console.error);
req.write(data);
req.end();
