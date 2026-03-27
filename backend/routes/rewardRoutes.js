import { Router } from 'express';
import {
  createReward,
  getRewards,
  updateReward,
  deleteReward,
  redeemReward,
  getUserRewards,
  getLeaderboard
} from '../controllers/rewardController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/rewards:
 *   get:
 *     summary: List all rewards
 *   post:
 *     summary: Create a new reward (admin)
 */
router
  .route('/')
  .get(protect, getRewards)
  .post(protect, authorizeRoles('admin'), createReward);

/**
 * @openapi
 * /api/rewards/{id}:
 *   patch:
 *     summary: Update reward (admin)
 *   delete:
 *     summary: Delete reward (admin)
 */
router
  .route('/:id')
  .patch(protect, authorizeRoles('admin'), updateReward)
  .delete(protect, authorizeRoles('admin'), deleteReward);

/**
 * @openapi
 * /api/rewards/redeem:
 *   post:
 *     summary: Redeem a reward using points
 */
router.post('/redeem', protect, redeemReward);

/**
 * @openapi
 * /api/rewards/me:
 *   get:
 *     summary: Get current user's reward redemptions
 */
router.get('/me', protect, getUserRewards);

/**
 * @openapi
 * /api/leaderboard:
 *   get:
 *     summary: Get monthly leaderboard
 */
router.get('/leaderboard', protect, getLeaderboard);

export default router;

