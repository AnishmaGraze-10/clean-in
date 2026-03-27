import express from 'express';
import Challenge from '../models/Challenge.js';
import UserChallenge from '../models/UserChallenge.js';
import WasteReport from '../models/WasteReport.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/challenges/active
 * @desc    Get all active challenges
 * @access  Private
 */
router.get('/active', protect, async (req, res) => {
  try {
    const now = new Date();
    
    const challenges = await Challenge.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ endDate: 1 });

    res.json(challenges);
  } catch (error) {
    console.error('Get active challenges error:', error);
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
});

/**
 * @route   GET /api/challenges/user-progress
 * @desc    Get user's progress on all active challenges
 * @access  Private
 */
router.get('/user-progress', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Get active challenges
    const activeChallenges = await Challenge.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Get user's progress for these challenges
    const userProgress = await UserChallenge.find({
      userId,
      challengeId: { $in: activeChallenges.map(c => c._id) }
    });

    // Combine challenge data with progress
    const progressData = await Promise.all(
      activeChallenges.map(async (challenge) => {
        const progress = userProgress.find(
          up => up.challengeId.toString() === challenge._id.toString()
        ) || { progress: 0, completed: false };

        // Calculate current progress based on user's reports
        let currentProgress = progress.progress;
        
        if (!progress.completed) {
          currentProgress = await calculateProgress(userId, challenge);
          
          // Update progress in database
          if (currentProgress > progress.progress) {
            await UserChallenge.findOneAndUpdate(
              { userId, challengeId: challenge._id },
              { progress: currentProgress },
              { upsert: true, new: true }
            );
          }
        }

        return {
          challengeId: challenge._id,
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          goal: challenge.goalCount,
          progress: currentProgress,
          completed: currentProgress >= challenge.goalCount,
          rewardPoints: challenge.rewardPoints,
          endDate: challenge.endDate,
          daysLeft: Math.ceil((challenge.endDate - now) / (1000 * 60 * 60 * 24))
        };
      })
    );

    res.json(progressData);
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

/**
 * @route   POST /api/challenges/complete
 * @desc    Complete a challenge and claim reward
 * @access  Private
 */
router.post('/complete', protect, async (req, res) => {
  try {
    const { challengeId } = req.body;
    const userId = req.user._id;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    let userChallenge = await UserChallenge.findOne({
      userId,
      challengeId
    });

    if (!userChallenge) {
      // Calculate current progress
      const progress = await calculateProgress(userId, challenge);
      userChallenge = new UserChallenge({
        userId,
        challengeId,
        progress,
        completed: progress >= challenge.goalCount
      });
    }

    if (userChallenge.completed) {
      return res.status(400).json({ message: 'Challenge already completed' });
    }

    // Check if goal reached
    if (userChallenge.progress < challenge.goalCount) {
      return res.status(400).json({ 
        message: 'Challenge goal not yet reached',
        progress: userChallenge.progress,
        goal: challenge.goalCount
      });
    }

    // Mark as completed and award points
    userChallenge.completed = true;
    userChallenge.completedAt = new Date();
    await userChallenge.save();

    // Add reward points to user
    await User.findByIdAndUpdate(userId, {
      $inc: { points: challenge.rewardPoints }
    });

    res.json({
      success: true,
      message: 'Challenge completed!',
      rewardPoints: challenge.rewardPoints,
      totalProgress: userChallenge.progress
    });
  } catch (error) {
    console.error('Complete challenge error:', error);
    res.status(500).json({ message: 'Failed to complete challenge' });
  }
});

/**
 * Calculate user's progress for a specific challenge
 */
async function calculateProgress(userId, challenge) {
  const query = {
    userId,
    createdAt: { $gte: challenge.startDate, $lte: challenge.endDate }
  };

  if (challenge.targetZone) {
    query.zone = challenge.targetZone;
  }

  if (challenge.targetWasteType) {
    query.wasteType = challenge.targetWasteType;
  }

  // For verified reports only
  if (challenge.type === 'weekly_reports') {
    query.status = 'verified';
  }

  const count = await WasteReport.countDocuments(query);
  return count;
}

export default router;
