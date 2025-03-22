const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
    origin: [
        'https://bussevaadmin.netlify.app',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'https://busseva-kolkata-backend.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests with more detail
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Origin:', req.get('origin'));
    console.log('Host:', req.get('host'));
    next();
});

// Root route for checking server status
app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.status(200).json({ 
        message: 'BusSevaKolkata Backend is running!',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        status: 'success',
        host: req.get('host')
    });
});

// API root route
app.get('/api', (req, res) => {
    console.log('API root route accessed');
    res.status(200).json({
        message: 'BusSevaKolkata API is running!',
        endpoints: {
            admin: '/api/admin',
            buses: '/api/buses'
        },
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/test', (req, res) => {
    console.log('Test route accessed');
    res.status(200).json({ message: 'Test route is working!' });
});

// Add OPTIONS handler for root route
app.options('/', (req, res) => {
    console.log('OPTIONS request for root route');
    res.status(200).end();
});

// Add OPTIONS handler for API route
app.options('/api', (req, res) => {
    console.log('OPTIONS request for API route');
    res.status(200).end();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');
    
    // Create admin user if it doesn't exist
    try {
        const Admin = require('./models/Admin');
        const admin = await Admin.findOne({ username: 'admin' });
        
        if (!admin) {
            console.log('Creating default admin user...');
            const newAdmin = new Admin({
                username: 'admin',
                password: 'admin123'
            });
            await newAdmin.save();
            console.log('Default admin user created successfully');
        } else {
            console.log('Admin user already exists');
            // Update admin password if needed
            if (process.env.NODE_ENV === 'development') {
                admin.password = 'admin123';
                await admin.save();
                console.log('Admin password updated');
            }
        }
    } catch (error) {
        console.error('Error managing admin user:', error);
    }
})
.catch((err) => console.error('MongoDB connection error:', err));

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Routes
const busRoutes = require('./routes/busRoutes');
app.use('/api/buses', busRoutes);

// Admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        requested_url: req.url,
        available_endpoints: {
            root: '/',
            api: '/api',
            admin: '/api/admin',
            buses: '/api/buses'
        }
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
}); 