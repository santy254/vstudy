const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateUser } = require('../middleware/authMiddleware');

// Get all notifications for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    res.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: getNotificationTitle(notification),
        message: notification.message,
        time: formatTime(notification.createdAt),
        read: notification.read,
        createdAt: notification.createdAt,
        referenceId: notification.referenceId,
        referenceModel: notification.referenceModel
      }))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateUser, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Create a new notification (internal use)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { userId, type, message, referenceId, referenceModel } = req.body;

    const notification = new Notification({
      userId: userId || req.user._id,
      type,
      message,
      referenceId,
      referenceModel
    });

    await notification.save();

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId || req.user._id}`).emit('newNotification', {
        id: notification._id,
        type: notification.type,
        title: getNotificationTitle(notification),
        message: notification.message,
        time: formatTime(notification.createdAt),
        read: notification.read,
        createdAt: notification.createdAt
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Delete a notification
router.delete('/:notificationId', authenticateUser, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

// Helper functions
function getNotificationTitle(notification) {
  const titles = {
    task: '📝 Task Update',
    group: '👥 Group Activity',
    message: '💬 New Message',
    video: '🎥 Video Session',
    system: '⚙️ System Update',
    reminder: '⏰ Reminder',
    course: '📚 Course Update'
  };
  return titles[notification.type] || '📢 Notification';
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

module.exports = router;