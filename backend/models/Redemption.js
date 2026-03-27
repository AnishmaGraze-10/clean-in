import mongoose from 'mongoose';

const redemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      required: true
    },
    pointsUsed: {
      type: Number,
      required: true
    }
  },
  { timestamps: { createdAt: 'date', updatedAt: 'updatedAt' } }
);

const Redemption = mongoose.model('Redemption', redemptionSchema);

export default Redemption;

