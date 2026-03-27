import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getAllBadges, getUserBadges } from '../controllers/badgeController.js';

const router = Router();

router.get('/', protect, getAllBadges);
router.get('/my-badges', protect, getUserBadges);

export default router;
