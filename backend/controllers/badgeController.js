import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';

export const getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true });
    res.json(badges);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ message: 'Failed to fetch badges' });
  }
};

export const getUserBadges = async (req, res) => {
  try {
    const userBadges = await UserBadge.find({ userId: req.user._id })
      .populate('badgeId')
      .sort({ earnedAt: -1 });
    
    res.json(userBadges.map(ub => ({
      ...ub.badgeId.toObject(),
      earnedAt: ub.earnedAt
    })));
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({ message: 'Failed to fetch user badges' });
  }
};

export const checkAndAwardBadges = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Get user stats
    const reports = await WasteReport.find({ userId });
    const verifiedReports = reports.filter(r => r.status === 'verified');
    
    const stats = {
      totalReports: reports.length,
      verifiedReports: verifiedReports.length,
      points: user.points || 0
    };

    // Get all active badges
    const badges = await Badge.find({ isActive: true });
    
    // Get already earned badges
    const earnedBadges = await UserBadge.find({ userId });
    const earnedBadgeIds = earnedBadges.map(eb => eb.badgeId.toString());

    // Check each badge
    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge._id.toString())) continue;

      let shouldAward = false;
      const { type, value } = badge.requirement;

      switch (type) {
        case 'reports':
          shouldAward = stats.totalReports >= value;
          break;
        case 'verified':
          shouldAward = stats.verifiedReports >= value;
          break;
        case 'points':
          shouldAward = stats.points >= value;
          break;
      }

      if (shouldAward) {
        await UserBadge.create({
          userId,
          badgeId: badge._id
        });
      }
    }
  } catch (error) {
    console.error('Check and award badges error:', error);
  }
};

export const initializeBadges = async () => {
  try {
    const count = await Badge.countDocuments();
    if (count === 0) {
      const defaultBadges = [
        {
          name: 'First Report',
          description: 'Submit your first waste report',
          icon: 'FileText',
          color: '#16a34a',
          requirement: { type: 'reports', value: 1 }
        },
        {
          name: 'Reporter',
          description: 'Submit 10 waste reports',
          icon: 'FileText',
          color: '#2563eb',
          requirement: { type: 'reports', value: 10 }
        },
        {
          name: 'Dedicated Reporter',
          description: 'Submit 50 waste reports',
          icon: 'FileText',
          color: '#7c3aed',
          requirement: { type: 'reports', value: 50 }
        },
        {
          name: 'First Verified',
          description: 'Get your first report verified',
          icon: 'CheckCircle',
          color: '#16a34a',
          requirement: { type: 'verified', value: 1 }
        },
        {
          name: 'Verified Reporter',
          description: 'Get 10 reports verified',
          icon: 'CheckCircle',
          color: '#2563eb',
          requirement: { type: 'verified', value: 10 }
        },
        {
          name: 'Expert Reporter',
          description: 'Get 50 reports verified',
          icon: 'CheckCircle',
          color: '#7c3aed',
          requirement: { type: 'verified', value: 50 }
        },
        {
          name: 'Point Collector',
          description: 'Earn 100 points',
          icon: 'Trophy',
          color: '#f59e0b',
          requirement: { type: 'points', value: 100 }
        },
        {
          name: 'Point Hoarder',
          description: 'Earn 500 points',
          icon: 'Trophy',
          color: '#ec4899',
          requirement: { type: 'points', value: 500 }
        }
      ];

      await Badge.insertMany(defaultBadges);
      console.log('Default badges created');
    }
  } catch (error) {
    console.error('Initialize badges error:', error);
  }
};
