// Express app entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
require('./config/firebase');

const receptionRoutes = require('./routes/receptionRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clinicAdminRoutes = require('./routes/clinicAdminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const medicineRoutes = require('./routes/medicineRoutes');

const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Expose io to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket connection handling
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // WebRTC Signaling
    socket.on('join-video-room', ({ roomId, userId }) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });

    socket.on('webrtc-offer', (data) => {
        socket.to(data.roomId).emit('webrtc-offer', data);
    });

    socket.on('webrtc-answer', (data) => {
        socket.to(data.roomId).emit('webrtc-answer', data);
    });

    socket.on('webrtc-ice-candidate', (data) => {
        socket.to(data.roomId).emit('webrtc-ice-candidate', data);
    });

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
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/medicine', medicineRoutes);

// Health check
app.get('/health', (req, res) => res.send('Server is running'));

const db = require('./config/db');
const { initOutbreakScheduler } = require('./services/outbreakScheduler');

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    try {
        await db.query('SELECT 1');
        console.log('✅ Successfully connected to the database.');
        // Initialize Outbreak Monitoring Scheduler (Runs every 20 minutes)
        initOutbreakScheduler(io);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message || error);
    }
});
