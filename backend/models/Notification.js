import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['new-report', 'report-verified', 'report-rejected', 'challenge-completed', 'reward-redeemed', 'truck-assigned', 'route-completed'],
    required: true,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  data: {
    // Additional data payload (e.g., reportId, challengeId)
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  fcmSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for unread notifications
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
