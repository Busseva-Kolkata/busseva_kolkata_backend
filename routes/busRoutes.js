const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Bus = require('../models/Bus');
const jwt = require('jsonwebtoken');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max-size
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all buses
router.get('/', async (req, res) => {
    try {
        const buses = await Bus.find().sort({ createdAt: -1 });
        res.json(buses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single bus by number
router.get('/:busNumber', async (req, res) => {
    try {
        const bus = await Bus.findOne({ busNumber: req.params.busNumber });
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }
        res.json(bus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search buses by route
router.get('/search/:route', async (req, res) => {
    try {
        const buses = await Bus.find({
            route: { $regex: req.params.route, $options: 'i' }
        });
        res.json(buses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new bus
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        console.log('Adding new bus - Request body:', req.body);
        console.log('File details:', req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }

        const busData = {
            route: req.body.route,
            description: req.body.description,
            fare: parseFloat(req.body.fare),
            timings: req.body.timings,
            stops: req.body.stops.split(',').map(stop => stop.trim())
        };

        // Validate required fields
        if (!busData.route || !busData.description || !busData.fare || !busData.timings || !busData.stops.length) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Add image URL
        busData.imageUrl = `/uploads/${req.file.filename}`;

        const bus = new Bus(busData);
        const savedBus = await bus.save();
        
        console.log('Bus saved successfully:', savedBus);
        res.status(201).json(savedBus);
    } catch (error) {
        console.error('Error adding bus:', error);
        if (req.file) {
            // Delete uploaded file if save fails
            fs.unlink(req.file.path, (unlinkError) => {
                if (unlinkError) console.error('Error deleting file:', unlinkError);
            });
        }
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 
