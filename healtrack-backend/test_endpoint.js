const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 11, role: 'ClinicAdmin', clinic_id: 3 }, 'secret');

fetch('http://localhost:5001/api/clinic-admin/3/reports/financial', {
    headers: { Authorization: `Bearer ${token}` }
}).then(res => res.json()).then(console.log).catch(console.error);
