const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { authenticateUser } = require('../middleware/authMiddleware');

// Get dashboard statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get user data
    const user = await User.findById(userId);

    // Task statistics
    const totalTasks = await Task.countDocuments({ createdBy: userId });
    const completedTasks = await Task.countDocuments({ createdBy: userId, status: 'completed' });
    const tasksToday = await Task.countDocuments({ 
      createdBy: userId, 
      createdAt: { $gte: startOfDay } 
    });
    const tasksThisWeek = await Task.countDocuments({ 
      createdBy: userId, 
      createdAt: { $gte: startOfWeek } 
    });
    const completedTasksToday = await Task.countDocuments({ 
      createdBy: userId, 
      status: 'completed',
      updatedAt: { $gte: startOfDay } 
    });

    // Group statistics
    const activeGroups = await Group.countDocuments({ 'members.userId': userId });
    const groupsCreated = await Group.countDocuments({ createdBy: userId });

    // Message statistics
    const messagesThisWeek = await Message.countDocuments({ 
      userId, 
      createdAt: { $gte: startOfWeek } 
    });

    // Notification statistics
    const unreadNotifications = await Notification.countDocuments({ userId, read: false });

    // Calculate study streak (simplified - based on task completion)
    const studyStreak = await calculateStudyStreak(userId);

    // Calculate weekly goal progress (based on completed tasks)
    const weeklyGoal = 10; // Default weekly goal
    const weeklyProgress = Math.min((completedTasksToday / weeklyGoal) * 100, 100);

    // Get recent activity
    const recentTasks = await Task.find({ createdBy: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('taskName status updatedAt');

    const recentGroups = await Group.find({ 'members.userId': userId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('groupName updatedAt');

    // Weekly activity data (last 7 days)
    const weeklyActivity = await getWeeklyActivity(userId);

    const stats = {
      user: {
        name: user.name,
        email: user.email,
        joinedDate: user.createdAt
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        today: tasksToday,
        thisWeek: tasksThisWeek,
        completedToday: completedTasksToday,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      groups: {
        active: activeGroups,
        created: groupsCreated
      },
      activity: {
        messagesThisWeek,
        studyStreak,
        weeklyProgress: Math.round(weeklyProgress)
      },
      notifications: {
        unread: unreadNotifications
      },
      recent: {
        tasks: recentTasks.map(task => ({
          id: task._id,
          name: task.taskName,
          status: task.status,
          updatedAt: task.updatedAt
        })),
        groups: recentGroups.map(group => ({
          id: group._id,
          name: group.groupName,
          updatedAt: group.updatedAt
        }))
      },
      weeklyActivity
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get real-time activity feed
router.get('/activity-feed', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent activities from different sources
    const recentTasks = await Task.find({ createdBy: userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('taskName status updatedAt createdAt');

    const recentGroups = await Group.find({ 'members.userId': userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('groupName updatedAt');

    const recentMessages = await Message.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('groupId', 'groupName')
      .select('content createdAt groupId');

    // Combine and sort activities
    const activities = [];

    recentTasks.forEach(task => {
      activities.push({
        type: 'task',
        title: task.status === 'completed' ? 'Completed Task' : 'Updated Task',
        description: task.taskName,
        timestamp: task.updatedAt,
        icon: task.status === 'completed' ? '✅' : '📝'
      });
    });

    recentGroups.forEach(group => {
      activities.push({
        type: 'group',
        title: 'Group Activity',
        description: `Activity in ${group.groupName}`,
        timestamp: group.updatedAt,
        icon: '👥'
      });
    });

    recentMessages.forEach(message => {
      activities.push({
        type: 'message',
        title: 'Sent Message',
        description: `Message in ${message.groupId?.groupName || 'Unknown Group'}`,
        timestamp: message.createdAt,
        icon: '💬'
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      activities: limitedActivities.map(activity => ({
        ...activity,
        timeAgo: formatTimeAgo(activity.timestamp)
      }))
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity feed'
    });
  }
});

// Helper functions
async function calculateStudyStreak(userId) {
  try {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    // Check each day going backwards
    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const hasActivity = await Task.exists({
        createdBy: userId,
        $or: [
          { createdAt: { $gte: startOfDay, $lt: endOfDay } },
          { updatedAt: { $gte: startOfDay, $lt: endOfDay } }
        ]
      });

      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating study streak:', error);
    return 0;
  }
}

async function getWeeklyActivity(userId) {
  try {
    const today = new Date();
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const taskCount = await Task.countDocuments({
        createdBy: userId,
        $or: [
          { createdAt: { $gte: startOfDay, $lt: endOfDay } },
          { updatedAt: { $gte: startOfDay, $lt: endOfDay } }
        ]
      });

      const messageCount = await Message.countDocuments({
        userId,
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });

      weeklyData.push({
        date: startOfDay.toISOString().split('T')[0],
        day: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
        activity: taskCount + messageCount,
        tasks: taskCount,
        messages: messageCount
      });
    }

    return weeklyData;
  } catch (error) {
    console.error('Error getting weekly activity:', error);
    return [];
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

module.exports = router;