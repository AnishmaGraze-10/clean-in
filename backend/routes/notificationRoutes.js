import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendCustomNotification,
  updateFCMToken
} from '../controllers/notificationController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get user notifications
router.get('/user/:userId', getUserNotifications);

// Get unread count
router.get('/unread-count/:userId', getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all as read
router.put('/mark-all-read/:userId', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Update FCM token
router.put('/fcm-token/:userId', updateFCMToken);

// Admin only - send custom notification
router.post('/send-custom', adminOnly, sendCustomNotification);

export default router;
