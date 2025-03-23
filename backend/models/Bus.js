const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    unique: true,
    default: () => 'BUS' + Date.now().toString().slice(-6)
  },
  route: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  timings: {
    type: String,
    required: true
  },
  stops: [{
    type: String,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bus', busSchema); 