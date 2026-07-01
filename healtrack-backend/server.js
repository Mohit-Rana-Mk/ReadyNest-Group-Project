// Express app entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const receptionRoutes = require('./routes/receptionRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clinicAdminRoutes = require('./routes/clinicAdminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Expose io to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket connection handling
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('A client disconnected:', socket.id);
    });
});

// Mount routes
app.use('/api/reception', receptionRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clinic-admin', clinicAdminRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => res.send('Server is running'));

const db = require('./config/db');

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    try {
        await db.query('SELECT 1');
        console.log('✅ Successfully connected to the database.');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message || error);
    }
});
