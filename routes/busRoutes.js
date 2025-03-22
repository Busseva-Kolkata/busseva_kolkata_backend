const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');

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

module.exports = router; 