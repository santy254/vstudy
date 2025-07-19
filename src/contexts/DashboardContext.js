import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../api';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [stats, setStats] = useState({
    user: { name: 'Student', email: '', joinedDate: null },
    tasks: { total: 0, completed: 0, today: 0, thisWeek: 0, completedToday: 0, completionRate: 0 },
    groups: { active: 0, created: 0 },
    activity: { messagesThisWeek: 0, studyStreak: 0, weeklyProgress: 0 },
    notifications: { unread: 0 },
    recent: { tasks: [], groups: [] },
    weeklyActivity: []
  });
  
  const [activityFeed, setActivityFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5002', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔗 Connected to dashboard socket');
      
      // Join user-specific room for dashboard updates
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user._id) {
        newSocket.emit('join', `dashboard_${user._id}`);
      }
    });

    // Listen for real-time dashboard updates
    newSocket.on('dashboardUpdate', (updateData) => {
      console.log('📊 Dashboard update received:', updateData);
      setStats(prev => ({
        ...prev,
        ...updateData
      }));
      setLastUpdated(new Date());
    });

    // Listen for task updates
    newSocket.on('taskUpdate', (taskData) => {
      console.log('📝 Task update received:', taskData);
      fetchStats(); // Refresh stats when tasks change
    });

    // Listen for group updates
    newSocket.on('groupUpdate', (groupData) => {
      console.log('👥 Group update received:', groupData);
      fetchStats(); // Refresh stats when groups change
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial dashboard data
  useEffect(() => {
    fetchStats();
    fetchActivityFeed();
  }, []);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchActivityFeed();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/dashboard/stats');
      
      if (response.data.success) {
        setStats(response.data.stats);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivityFeed = async (limit = 10) => {
    try {
      const response = await api.get(`/dashboard/activity-feed?limit=${limit}`);
      
      if (response.data.success) {
        setActivityFeed(response.data.activities);
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    }
  };

  const refreshStats = () => {
    fetchStats();
    fetchActivityFeed();
  };

  // Helper functions for formatted data
  const getFormattedStats = () => {
    return {
      ...stats,
      formattedData: {
        completionRate: `${stats.tasks.completionRate}%`,
        studyStreak: `${stats.activity.studyStreak} days`,
        weeklyProgress: `${stats.activity.weeklyProgress}%`,
        totalTimeToday: formatTime(stats.activity.totalTimeToday || 0),
        averageSessionTime: formatTime(stats.activity.averageSessionTime || 0)
      }
    };
  };

  const getWeeklyActivityChart = () => {
    return stats.weeklyActivity.map(day => ({
      ...day,
      percentage: Math.max(10, Math.min(100, (day.activity / 10) * 100)) // Scale for chart display
    }));
  };

  const getRecentAchievements = () => {
    const achievements = [];
    
    if (stats.activity.studyStreak >= 7) {
      achievements.push({
        icon: '🔥',
        title: 'Week Warrior',
        description: `${stats.activity.studyStreak} day study streak!`
      });
    }
    
    if (stats.tasks.completionRate >= 80) {
      achievements.push({
        icon: '🎯',
        title: 'Task Master',
        description: `${stats.tasks.completionRate}% completion rate`
      });
    }
    
    if (stats.groups.active >= 3) {
      achievements.push({
        icon: '👥',
        title: 'Social Learner',
        description: `Active in ${stats.groups.active} groups`
      });
    }
    
    if (stats.activity.weeklyProgress >= 100) {
      achievements.push({
        icon: '⭐',
        title: 'Goal Crusher',
        description: 'Exceeded weekly goal!'
      });
    }

    return achievements;
  };

  const getMotivationalMessage = () => {
    const messages = {
      high: [
        "You're crushing it! Keep up the amazing work! 🚀",
        "Outstanding progress! You're on fire! 🔥",
        "Incredible dedication! You're a study superstar! ⭐"
      ],
      medium: [
        "Great job! You're making solid progress! 💪",
        "Keep it up! You're doing really well! 👍",
        "Nice work! Stay focused and keep going! 🎯"
      ],
      low: [
        "Every step counts! You've got this! 💪",
        "Progress is progress! Keep moving forward! 🌟",
        "Don't give up! Small steps lead to big achievements! ✨"
      ]
    };

    let level = 'low';
    if (stats.activity.weeklyProgress >= 70) level = 'high';
    else if (stats.activity.weeklyProgress >= 40) level = 'medium';

    const levelMessages = messages[level];
    return levelMessages[Math.floor(Math.random() * levelMessages.length)];
  };

  // Utility functions
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = stats.user.name || 'Student';
    
    if (hour < 12) return `Good Morning, ${name}! ☀️`;
    if (hour < 17) return `Good Afternoon, ${name}! 🌤️`;
    return `Good Evening, ${name}! 🌙`;
  };

  const value = {
    stats,
    activityFeed,
    isLoading,
    lastUpdated,
    fetchStats,
    fetchActivityFeed,
    refreshStats,
    getFormattedStats,
    getWeeklyActivityChart,
    getRecentAchievements,
    getMotivationalMessage,
    getGreeting,
    formatTime
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;