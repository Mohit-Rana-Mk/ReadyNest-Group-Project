// Express app entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const receptionRoutes = require('./routes/receptionRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clinicAdminRoutes = require('./routes/clinicAdminRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/reception', receptionRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clinic-admin', clinicAdminRoutes);

// Health check
app.get('/health', (req, res) => res.send('Server is running'));

const db = require('./config/db');

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    try {
        await db.query('SELECT 1');
        console.log('✅ Successfully connected to the database.');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message || error);
    }
});
