import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['weekly_reports', 'zone_cleaning', 'plastic_collection', 'general_collection']
  },
  goalCount: {
    type: Number,
    required: true,
    min: 1
  },
  rewardPoints: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  targetZone: {
    type: String,
    default: null
  },
  targetWasteType: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
challengeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
