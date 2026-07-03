const http = require('http');
const jwt = require('jsonwebtoken');

const adminToken = jwt.sign({ id: 1, role: 'SuperAdmin' }, 'super_secret_jwt_key', { expiresIn: '1d' });
const patientToken = jwt.sign({ id: 5, role: 'Patient' }, 'super_secret_jwt_key', { expiresIn: '1d' });

function request(method, path, token, body = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const req = http.request({
            hostname: 'localhost',
            port: 5001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(body && { 'Content-Length': data.length })
            }
        }, res => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: resBody }));
        });
        req.on('error', reject);
        if (body) req.write(data);
        req.end();
    });
}

async function run() {
    console.log("1. Broadcasting alert as admin...");
    const broadcastRes = await request('POST', '/api/admin/broadcast-awareness', adminToken, {
        disease: 'Super Bug',
        title: 'Super Bug Alert',
        description: 'Watch out for the super bug!'
    });
    console.log("Broadcast Result:", broadcastRes.status, broadcastRes.data);

    console.log("2. Fetching recommendations as patient (user_id = 5)...");
    const recsRes = await request('GET', '/api/patient/recommendations', patientToken);
    console.log("Recommendations Result Status:", recsRes.status);
    
    const recs = JSON.parse(recsRes.data);
    console.log("Number of pending recommendations:", recs.length);
    if (recs.length > 0) {
        console.log("Top recommendation:", recs[0]);
    }
}
run();
