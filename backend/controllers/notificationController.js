import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushNotification, sendBulkNotification } from '../services/firebaseService.js';
import { getIO } from '../config/socket.js';

// Create and send notification
export const createNotification = async (userId, title, message, type, data = {}) => {
  try {
    // Save notification to database
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      data
    });
    await notification.save();

    // Emit WebSocket event
    const io = getIO();
    if (io) {
      io.to(userId.toString()).emit(type, {
        notificationId: notification._id,
        title,
        message,
        type,
        data,
        createdAt: notification.createdAt
      });
    }

    // Try to send push notification if user has FCM token
    const user = await User.findById(userId);
    if (user && user.fcmToken) {
      await sendPushNotification(user.fcmToken, title, message, {
        notificationId: notification._id.toString(),
        type,
        ...data
      });
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Send notification to all admins
export const notifyAdmins = async (title, message, type, data = {}) => {
  try {
    const admins = await User.find({ role: 'admin' });
    
    const notifications = await Promise.all(
      admins.map(admin => createNotification(admin._id, title, message, type, data))
    );

    return notifications;
  } catch (error) {
    console.error('Notify admins error:', error);
    throw error;
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    const totalCount = await Notification.countDocuments({ userId });

    res.json({
      notifications,
      unreadCount,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndDelete(notificationId);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Notification.countDocuments({ userId, isRead: false });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Send custom notification (admin only)
export const sendCustomNotification = async (req, res) => {
  try {
    const { userIds, title, message, type, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs required' });
    }

    const notifications = await Promise.all(
      userIds.map(userId => createNotification(userId, title, message, type || 'custom', data))
    );

    res.json({
      success: true,
      sentCount: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Send custom notification error:', error);
    res.status(500).json({ message: 'Failed to send notifications' });
  }
};

// Update FCM token
export const updateFCMToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token required' });
    }

    await User.findByIdAndUpdate(userId, { fcmToken });

    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ message: 'Failed to update FCM token' });
  }
};
