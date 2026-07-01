const db = require('./config/db');
db.query('SELECT DISTINCT city FROM clinics').then(console.log);
