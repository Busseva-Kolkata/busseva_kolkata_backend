const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
    origin: [
        'https://busseva.netlify.app',
        'http://localhost:3000',
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

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

// Create admin user if not exists
const createAdminUser = async () => {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            const admin = new Admin({
                username: 'admin',
                password: 'admin123'
            });
            await admin.save();
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user exists in database - updating password');
            // Force update the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            // Update password directly in database
            await Admin.updateOne(
                { username: 'admin' },
                { $set: { password: hashedPassword } }
            );
            console.log('Admin password updated successfully');
        }
    } catch (error) {
        console.error('Error managing admin user:', error);
        console.error('Error details:', error.message);
    }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');
    await createAdminUser(); // Wait for admin user creation/update
    console.log('Admin user setup completed');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

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
    res.status(500).json({ 
        message: 'Internal server error', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Handle 404
app.use((req, res) => {
    console.log('404 - Route not found:', req.url);
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
    console.log('Available Routes:');
    console.log('- GET /');
    console.log('- GET /api');
    console.log('- GET /test');
    console.log('- POST /api/admin/login');
    console.log('- GET /api/buses');
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
