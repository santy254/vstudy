import api from '../api';

// Helper class for managing real-time notifications
class NotificationHelper {
  static async createTaskNotification(taskName, action = 'created') {
    const messages = {
      created: `New task "${taskName}" has been created`,
      completed: `Task "${taskName}" has been completed! 🎉`,
      updated: `Task "${taskName}" has been updated`,
      deleted: `Task "${taskName}" has been deleted`
    };

    return this.createNotification('task', messages[action] || messages.created);
  }

  static async createGroupNotification(groupName, action = 'joined') {
    const messages = {
      joined: `You joined the group "${groupName}" 👥`,
      created: `New group "${groupName}" has been created`,
      updated: `Group "${groupName}" has been updated`,
      left: `You left the group "${groupName}"`
    };

    return this.createNotification('group', messages[action] || messages.joined);
  }

  static async createSystemNotification(message) {
    return this.createNotification('system', message);
  }

  static async createReminderNotification(message) {
    return this.createNotification('reminder', message);
  }

  static async createCourseNotification(courseName, action = 'enrolled') {
    const messages = {
      enrolled: `You enrolled in "${courseName}" 📚`,
      updated: `Course "${courseName}" has new content`,
      completed: `You completed "${courseName}"! 🎓`
    };

    return this.createNotification('course', messages[action] || messages.enrolled);
  }

  static async createNotification(type, message, referenceId = null, referenceModel = null) {
    try {
      const response = await api.post('/notifications', {
        type,
        message,
        referenceId,
        referenceModel
      });

      if (response.data.success) {
        console.log('✅ Notification created:', response.data.notification);
        return response.data.notification;
      }
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
  }

  // Trigger notifications for common dashboard events
  static async onTaskCompleted(taskName, taskId) {
    await this.createTaskNotification(taskName, 'completed');
    await this.createSystemNotification(`Great job! You're making excellent progress! 🚀`);
  }

  static async onGroupJoined(groupName, groupId) {
    await this.createGroupNotification(groupName, 'joined');
    await this.createSystemNotification(`Welcome to your new study group! Start collaborating! 💪`);
  }

  static async onStudyStreakAchieved(days) {
    await this.createSystemNotification(`🔥 Amazing! You've maintained a ${days}-day study streak! Keep it up!`);
  }

  static async onWeeklyGoalReached() {
    await this.createSystemNotification(`🎯 Congratulations! You've reached your weekly goal! You're crushing it!`);
  }

  static async onProfileUpdated() {
    await this.createSystemNotification(`✅ Your profile has been successfully updated!`);
  }

  static async onPasswordChanged() {
    await this.createSystemNotification(`🔒 Your password has been changed successfully. Your account is secure!`);
  }

  // Schedule reminder notifications
  static async scheduleTaskReminder(taskName, dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due - now;
    const daysBefore = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysBefore <= 2 && daysBefore > 0) {
      await this.createReminderNotification(
        `⏰ Reminder: "${taskName}" is due in ${daysBefore} day${daysBefore > 1 ? 's' : ''}!`
      );
    } else if (daysBefore === 0) {
      await this.createReminderNotification(
        `🚨 Urgent: "${taskName}" is due today!`
      );
    }
  }

  // Motivational notifications based on activity
  static async sendMotivationalNotification(stats) {
    const { completionRate, studyStreak, weeklyProgress } = stats;

    if (completionRate >= 80 && studyStreak >= 7) {
      await this.createSystemNotification(
        `🌟 You're absolutely crushing it! ${completionRate}% completion rate and ${studyStreak}-day streak!`
      );
    } else if (weeklyProgress >= 100) {
      await this.createSystemNotification(
        `🎉 Weekly goal smashed! You've exceeded your target by ${weeklyProgress - 100}%!`
      );
    } else if (studyStreak >= 5) {
      await this.createSystemNotification(
        `🔥 ${studyStreak} days in a row! You're building an amazing habit!`
      );
    }
  }

  // Achievement notifications
  static async checkAndNotifyAchievements(stats) {
    const achievements = [];

    if (stats.tasks.completionRate >= 90) {
      achievements.push('🎯 Task Master - 90%+ completion rate!');
    }

    if (stats.activity.studyStreak >= 10) {
      achievements.push('🔥 Study Warrior - 10+ day streak!');
    }

    if (stats.groups.active >= 5) {
      achievements.push('👥 Social Learner - Active in 5+ groups!');
    }

    if (stats.activity.weeklyProgress >= 150) {
      achievements.push('⭐ Overachiever - 150% weekly goal!');
    }

    // Send achievement notifications
    for (const achievement of achievements) {
      await this.createSystemNotification(`🏆 Achievement Unlocked: ${achievement}`);
    }
  }
}

export default NotificationHelper;