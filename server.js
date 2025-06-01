const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection - FIXED VERSION
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-showcase';

// Updated connection without deprecated options
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
    console.log('MongoDB connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
})
.catch(err => {
    console.error('MongoDB connection error:', err.message);
});

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'https://vit-student-showcase-frontend.vercel.app',
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for now
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ 
        message: 'VIT Student Showcase API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongoState: mongoose.connection.readyState
    });
});

// Test database connection route
app.get('/api/test-db', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        res.json({
            status: 'success',
            mongoState: states[state],
            stateNumber: state
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Export for Vercel
module.exports = app;

// Start server only in development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
