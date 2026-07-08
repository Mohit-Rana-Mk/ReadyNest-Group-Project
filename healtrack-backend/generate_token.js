const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign({ id: 1, role: 'Patient' }, process.env.JWT_SECRET || 'super_secret_jwt_key');
console.log(token);
