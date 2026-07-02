fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'hello@gmail.com', password: 'password123' })
}).then(res => res.json()).then(data => {
  const jwt = require('jsonwebtoken');
  console.log("Token payload:", jwt.decode(data.data.token));
}).catch(console.error);
