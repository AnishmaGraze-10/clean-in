import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#16a34a'
  },
  requirement: {
    type: {
      type: String,
      enum: ['reports', 'verified', 'points', 'streak', 'challenges'],
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Badge', badgeSchema);
