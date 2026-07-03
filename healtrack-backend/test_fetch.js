const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 16, role: 'ClinicAdmin', clinic_id: 1 }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

const url = 'http://localhost:5001/api/clinic-admin/1/operational-dashboard?start_date=2026-01-01&end_date=2026-06-30&departments=Cardiology,General%20Medicine,Ophthalmology,Orthopedics,Pediatrics,Dermatology,ENT,Neurology,Gynecology,Psychiatry&statuses=Scheduled,Checked-In,In%20Consultation,Completed,Cancelled';

fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
})
.then(res => res.text().then(text => console.log('Status:', res.status, 'Body:', text)))
.catch(console.error);
