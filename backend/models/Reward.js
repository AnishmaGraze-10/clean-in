import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String
    },
    image: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      default: 100,
      min: 0
    }
  },
  { timestamps: true }
);

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;

