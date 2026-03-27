import mongoose from 'mongoose';

const truckSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  driverName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'inactive',
    index: true
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  assignedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteReport'
  }],
  route: [{
    latitude: Number,
    longitude: Number,
    address: String,
    wasteReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WasteReport'
    },
    visited: {
      type: Boolean,
      default: false
    },
    estimatedArrival: Date
  }],
  zone: {
    type: String,
    index: true
  },
  capacity: {
    type: Number,
    default: 1000 // in kg
  },
  currentLoad: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for geospatial queries
truckSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

const Truck = mongoose.model('Truck', truckSchema);

export default Truck;
