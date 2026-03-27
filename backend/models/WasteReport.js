import mongoose from 'mongoose';

const wasteReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    image: {
      type: String
    },
    wasteType: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    location: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    zone: {
      type: String,
      index: true
    }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Compound indexes for frequent queries
wasteReportSchema.index({ userId: 1, status: 1 });
wasteReportSchema.index({ createdAt: -1 });
wasteReportSchema.index({ latitude: 1, longitude: 1 });
wasteReportSchema.index({ zone: 1, status: 1 });

const WasteReport = mongoose.model('WasteReport', wasteReportSchema);

export default WasteReport;

