import { Router } from 'express';
import {
  createWasteReport,
  getUserReports,
  getPendingReports,
  getVerifiedReports,
  verifyReport,
  getZoneStatistics,
  getOptimizedRoute,
  getReportsByDateRange,
  getReportsByWasteType,
  getCollectionEfficiency,
  getParticipationTrends
} from '../controllers/wasteReportController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

/**
 * @openapi
 * /api/reports:
 *   post:
 *     summary: Submit a new waste report
 */
router.post('/', protect, upload.single('image'), createWasteReport);

/**
 * @openapi
 * /api/reports/user/{userId}:
 *   get:
 *     summary: Get all reports submitted by a user
 */
router.get('/user/:userId', protect, getUserReports);

/**
 * @openapi
 * /api/reports/pending:
 *   get:
 *     summary: Get all pending reports
 */
router.get('/pending', protect, authorizeRoles('admin'), getPendingReports);

/**
 * @openapi
 * /api/reports/verified:
 *   get:
 *     summary: Get all verified reports
 */
router.get('/verified', protect, authorizeRoles('admin'), getVerifiedReports);

/**
 * @openapi
 * /api/reports/{id}/verify:
 *   patch:
 *     summary: Approve or reject a waste report
 */
router.patch('/:id/verify', protect, authorizeRoles('admin'), verifyReport);

/**
 * @openapi
 * /api/reports/zones:
 *   get:
 *     summary: Get zone-wise statistics
 */
router.get('/zones', protect, authorizeRoles('admin'), getZoneStatistics);

/**
 * @openapi
 * /api/reports/optimize:
 *   post:
 *     summary: Get optimized collection route
 */
router.post('/optimize', protect, authorizeRoles('admin'), getOptimizedRoute);

/**
 * @openapi
 * /api/reports/analytics/daily:
 *   get:
 *     summary: Get reports by date range
 */
router.get('/analytics/daily', protect, authorizeRoles('admin'), getReportsByDateRange);

/**
 * @openapi
 * /api/reports/analytics/waste-type:
 *   get:
 *     summary: Get reports by waste type
 */
router.get('/analytics/waste-type', protect, authorizeRoles('admin'), getReportsByWasteType);

/**
 * @openapi
 * /api/reports/analytics/efficiency:
 *   get:
 *     summary: Get collection efficiency metrics
 */
router.get('/analytics/efficiency', protect, authorizeRoles('admin'), getCollectionEfficiency);

/**
 * @openapi
 * /api/reports/analytics/participation:
 *   get:
 *     summary: Get citizen participation trends
 */
router.get('/analytics/participation', protect, authorizeRoles('admin'), getParticipationTrends);

export default router;

