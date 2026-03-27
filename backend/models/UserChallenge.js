import mongoose from 'mongoose';

const userChallengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  reportsUsed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteReport'
  }]
}, {
  timestamps: true
});

// Compound index to ensure unique user-challenge pairs
userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);
export default UserChallenge;
