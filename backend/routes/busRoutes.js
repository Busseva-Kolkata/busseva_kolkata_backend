const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Bus = require('../models/Bus');
const jwt = require('jsonwebtoken');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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
        const buses = await Bus.find();
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
        console.log('Adding new bus:', req.body);
        console.log('File:', req.file);

        const busData = {
            route: req.body.route,
            description: req.body.description,
            fare: req.body.fare,
            timings: req.body.timings,
            stops: req.body.stops.split(',').map(stop => stop.trim())
        };

        if (req.file) {
            busData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const bus = new Bus(busData);
        const savedBus = await bus.save();
        console.log('Bus saved successfully:', savedBus);
        res.status(201).json(savedBus);
    } catch (error) {
        console.error('Error adding bus:', error);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 