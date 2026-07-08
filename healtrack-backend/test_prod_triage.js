const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, role: 'patient' }, 'super_secret_jwt_key');

fetch('https://healtrack-backend-7h3o.onrender.com/api/patient/triage', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ user_input: 'itching' })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
