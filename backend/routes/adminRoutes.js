const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Bus = require('../models/Bus');
const Admin = require('../models/Admin');

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

// Admin login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { username, password } = req.body;
    
    // Find admin user
    const admin = await Admin.findOne({ username });
    console.log('Admin found:', admin ? 'Yes' : 'No');

    if (!admin) {
      console.log('Admin not found with username:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isValidPassword = await admin.comparePassword(password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password for admin:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    console.log('Login successful for admin:', username);
    res.json({ token });
  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

// Create new bus
router.post('/buses', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const bus = new Bus({
      ...req.body,
      imageUrl: `/uploads/${req.file.filename}`,
      stops: req.body.stops.split(',').map(stop => stop.trim())
    });
    const newBus = await bus.save();
    res.status(201).json(newBus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update bus
router.put('/buses/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    if (req.body.stops) {
      updateData.stops = req.body.stops.split(',').map(stop => stop.trim());
    }
    
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(bus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete bus
router.delete('/buses/:id', verifyToken, async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 