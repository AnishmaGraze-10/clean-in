import Reward from '../models/Reward.js';
import Redemption from '../models/Redemption.js';
import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';

export const createReward = async (req, res, next) => {
  try {
    const reward = await Reward.create(req.body);
    res.status(201).json(reward);
  } catch (err) {
    next(err);
  }
};

export const getRewards = async (req, res, next) => {
  try {
    const rewards = await Reward.find();
    res.json(rewards);
  } catch (err) {
    next(err);
  }
};

export const updateReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findByIdAndUpdate(id, req.body, {
      new: true
    });

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    res.json(reward);
  } catch (err) {
    next(err);
  }
};

export const deleteReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findByIdAndDelete(id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const redeemReward = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { rewardId } = req.body;

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.points < reward.pointsCost) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    user.points -= reward.pointsCost;
    await user.save();

    const redemption = await Redemption.create({
      userId,
      rewardId,
      pointsUsed: reward.pointsCost
    });

    res.status(201).json({ redemption, remainingPoints: user.points });
  } catch (err) {
    next(err);
  }
};

export const getUserRewards = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const redemptions = await Redemption.find({ userId })
      .populate('rewardId')
      .sort({ date: -1 });

    res.json(redemptions);
  } catch (err) {
    next(err);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const leaderboard = await WasteReport.aggregate([
      {
        $match: {
          status: 'verified',
          createdAt: { $gte: firstDayOfMonth, $lte: now }
        }
      },
      {
        $group: {
          _id: '$userId',
          verifiedCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          points: { $multiply: ['$verifiedCount', 10] }
        }
      },
      {
        $sort: { points: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          name: '$user.name',
          email: '$user.email',
          points: 1
        }
      }
    ]);

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
};

