import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationHelper from '../../utils/notificationHelper';
import './Overview.css';

const Overview = () => {
  const navigate = useNavigate();
  const { 
    stats, 
    activityFeed, 
    isLoading, 
    lastUpdated, 
    refreshStats,
    getWeeklyActivityChart,
    getRecentAchievements,
    getMotivationalMessage,
    getGreeting,
    formatTime
  } = useDashboard();
  const { isConnected } = useNotifications();
  
  const [sessionStartTime] = useState(Date.now());
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [realTimeStats, setRealTimeStats] = useState({
    tasksCompletedToday: 0,
    studyTimeToday: 0,
    activeNow: true,
    productivityScore: 0,
    todayGoalProgress: 0
  });
  const [liveMetrics, setLiveMetrics] = useState({
    tasksPerHour: 0,
    averageTaskTime: 0,
    focusTime: 0,
    breakTime: 0
  });

  // Update current session time every minute and sync with backend
  useEffect(() => {
    const interval = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / (1000 * 60));
      setCurrentSessionTime(elapsed);
      
      // Refresh stats every 2 minutes for real-time updates
      if (elapsed % 2 === 0) {
        await refreshStats();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [sessionStartTime, refreshStats]);

  // Real-time task completion tracking and productivity metrics
  useEffect(() => {
    const updateRealTimeStats = () => {
      const totalStudyTime = currentSessionTime + 45;
      const dailyGoal = 120; // 2 hours in minutes
      const todayProgress = Math.min((totalStudyTime / dailyGoal) * 100, 100);
      
      // Calculate productivity score based on tasks completed vs time spent
      const productivityScore = stats.tasks.completedToday > 0 
        ? Math.min(((stats.tasks.completedToday / Math.max(totalStudyTime / 60, 1)) * 100), 100)
        : 0;

      setRealTimeStats(prev => ({
        ...prev,
        tasksCompletedToday: stats.tasks.completedToday,
        studyTimeToday: totalStudyTime,
        activeNow: Date.now() - sessionStartTime < 30 * 60 * 1000,
        productivityScore: Math.round(productivityScore),
        todayGoalProgress: Math.round(todayProgress)
      }));

      // Update live metrics
      setLiveMetrics(prev => ({
        ...prev,
        tasksPerHour: totalStudyTime > 0 ? (stats.tasks.completedToday / (totalStudyTime / 60)).toFixed(1) : 0,
        averageTaskTime: stats.tasks.completedToday > 0 ? (totalStudyTime / stats.tasks.completedToday).toFixed(0) : 0,
        focusTime: Math.round(totalStudyTime * 0.8), // Assume 80% focus time
        breakTime: Math.round(totalStudyTime * 0.2)  // Assume 20% break time
      }));
    };

    updateRealTimeStats();
  }, [stats.tasks.completedToday, currentSessionTime, sessionStartTime, stats.tasks.total]);

  // Auto-trigger achievement notifications based on real-time progress
  useEffect(() => {
    const checkAchievements = async () => {
      if (realTimeStats.todayGoalProgress >= 100 && realTimeStats.todayGoalProgress < 105) {
        await NotificationHelper.onWeeklyGoalReached();
      }
      
      if (stats.activity.studyStreak >= 7 && stats.activity.studyStreak % 7 === 0) {
        await NotificationHelper.onStudyStreakAchieved(stats.activity.studyStreak);
      }
      
      if (realTimeStats.productivityScore >= 80) {
        await NotificationHelper.createSystemNotification('🚀 High productivity detected! You\'re in the zone!');
      }
    };

    if (realTimeStats.tasksCompletedToday > 0) {
      checkAchievements();
    }
  }, [realTimeStats.todayGoalProgress, realTimeStats.productivityScore, stats.activity.studyStreak]);

  // Get formatted stats and achievements
  const weeklyChart = getWeeklyActivityChart();
  const achievements = getRecentAchievements();
  const motivationalMessage = getMotivationalMessage();
  const greeting = getGreeting();

  const handleQuickAction = (action) => {
    switch (action) {
      case 'newTask':
        navigate('/dashboard/task-manager');
        break;
      case 'joinGroup':
        navigate('/dashboard/group-management');
        break;
      case 'viewReport':
        navigate('/dashboard/project-report');
        break;
      default:
        break;
    }
  };

  return (
    <div className="overview-page">
      <div className="overview-container">
        <div className="overview-header">
          <div className="greeting-section">
            <h1>{greeting} 👋</h1>
            <p>{motivationalMessage}</p>
            {lastUpdated && (
              <small className="last-updated">
                <span className="update-indicator">🔄</span>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </small>
            )}
            {isLoading && (
              <div className="loading-indicator">
                <span className="loading-spinner">⏳</span>
                Updating dashboard...
              </div>
            )}
          </div>
          <div className="current-streak">
            <div className="streak-badge">
              <span className="streak-number">{stats.activity.studyStreak}</span>
              <span className="streak-label">Day Streak 🔥</span>
            </div>
            <button 
              className="refresh-btn"
              onClick={refreshStats}
              disabled={isLoading}
              title="Refresh dashboard data"
            >
              {isLoading ? '🔄' : '↻'}
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card time-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{formatTime(currentSessionTime + 45)}</div>
              <div className="stat-label">Time Today</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min((currentSessionTime + 45) / 120 * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="progress-text">Goal: 2h</span>
              </div>
            </div>
          </div>

          <div className="stat-card tasks-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.tasks.completed}</div>
              <div className="stat-label">Tasks Completed</div>
              <div className="stat-subtext">+{stats.tasks.thisWeek} this week</div>
            </div>
          </div>

          <div className="stat-card groups-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.groups.active}</div>
              <div className="stat-label">Active Groups</div>
              <div className="stat-subtext">{stats.groups.created} created by you</div>
            </div>
          </div>

          <div className="stat-card courses-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{stats.tasks.total}</div>
              <div className="stat-label">Total Tasks</div>
              <div className="stat-subtext">{stats.tasks.completionRate}% completion rate</div>
            </div>
          </div>

          <div className="stat-card sessions-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <div className="stat-value">{stats.tasks.today}</div>
              <div className="stat-label">Tasks Today</div>
              <div className="stat-subtext">{stats.tasks.completedToday} completed</div>
            </div>
          </div>

          <div className="stat-card progress-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{stats.activity.weeklyProgress}%</div>
              <div className="stat-label">Weekly Goal</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill weekly-progress" 
                    style={{ width: `${stats.activity.weeklyProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {stats.activity.weeklyProgress >= 100 ? 'Goal achieved!' : 'Keep going!'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Productivity Metrics */}
        <div className="live-metrics">
          <h2>⚡ Live Productivity Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card productivity">
              <div className="metric-icon">🚀</div>
              <div className="metric-content">
                <div className="metric-value">{realTimeStats.productivityScore}%</div>
                <div className="metric-label">Productivity Score</div>
                <div className="metric-trend">
                  {realTimeStats.productivityScore >= 80 ? '📈 Excellent' : 
                   realTimeStats.productivityScore >= 60 ? '📊 Good' : '📉 Improving'}
                </div>
              </div>
            </div>

            <div className="metric-card tasks-per-hour">
              <div className="metric-icon">⚡</div>
              <div className="metric-content">
                <div className="metric-value">{liveMetrics.tasksPerHour}</div>
                <div className="metric-label">Tasks/Hour</div>
                <div className="metric-trend">
                  {liveMetrics.tasksPerHour > 2 ? '🔥 High pace' : 
                   liveMetrics.tasksPerHour > 1 ? '⚡ Steady' : '🐌 Warming up'}
                </div>
              </div>
            </div>

            <div className="metric-card focus-time">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-value">{formatTime(liveMetrics.focusTime)}</div>
                <div className="metric-label">Focus Time</div>
                <div className="metric-trend">
                  {realTimeStats.activeNow ? '🟢 Active now' : '⏸️ On break'}
                </div>
              </div>
            </div>

            <div className="metric-card goal-progress">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-value">{realTimeStats.todayGoalProgress}%</div>
                <div className="metric-label">Daily Goal</div>
                <div className="metric-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill goal-progress" 
                      style={{ width: `${realTimeStats.todayGoalProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {realTimeStats.todayGoalProgress >= 100 ? '🎉 Achieved!' : 
                     realTimeStats.todayGoalProgress >= 75 ? '🔥 Almost there!' : 
                     '💪 Keep going!'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detailed-analytics">
          <h2>📊 Detailed Analytics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>📈 Weekly Activity</h3>
              <div className="activity-chart">
                <div className="chart-bars">
                  {weeklyChart.map((day, index) => (
                    <div 
                      key={index}
                      className="bar" 
                      style={{ height: `${day.percentage}%` }}
                      title={`${day.day}: ${day.activity} activities`}
                    >
                      <span>{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>🏆 Achievements</h3>
              <div className="achievements-list">
                {achievements.length > 0 ? (
                  achievements.map((achievement, index) => (
                    <div key={index} className="achievement-item">
                      <span className="achievement-icon">{achievement.icon}</span>
                      <div className="achievement-content">
                        <h4>{achievement.title}</h4>
                        <p>{achievement.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-achievements">
                    <span className="achievement-icon">🎯</span>
                    <div className="achievement-content">
                      <h4>Getting Started</h4>
                      <p>Complete more tasks to unlock achievements!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="analytics-card">
              <h3>📅 Recent Activity</h3>
              <div className="activity-timeline">
                {activityFeed.length > 0 ? (
                  activityFeed.slice(0, 5).map((activity, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>{activity.icon} {activity.title}</h4>
                        <p>{activity.description}</p>
                        <span className="timeline-time">{activity.timeAgo}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-activity">
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>🚀 Welcome to your dashboard!</h4>
                        <p>Start creating tasks and joining groups to see your activity here</p>
                        <span className="timeline-time">Just now</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => handleQuickAction('newTask')}
            >
              <span className="btn-icon">📝</span>
              <span className="btn-text">New Task</span>
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => handleQuickAction('joinGroup')}
            >
              <span className="btn-icon">👥</span>
              <span className="btn-text">Join Group</span>
            </button>
            <button 
              className="action-btn tertiary"
              onClick={() => handleQuickAction('viewReport')}
            >
              <span className="btn-icon">📊</span>
              <span className="btn-text">View Report</span>
            </button>
            <button 
              className="action-btn test"
              onClick={async () => {
                await NotificationHelper.createSystemNotification('🎉 Test notification! Your real-time system is working perfectly!');
                await NotificationHelper.createTaskNotification('Sample Task', 'completed');
              }}
            >
              <span className="btn-icon">🧪</span>
              <span className="btn-text">Test Notifications</span>
            </button>
          </div>
        </div>

        {/* Connection Status Indicator */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? (
            <>
              <span>🟢</span>
              <span>Real-time Connected</span>
            </>
          ) : (
            <>
              <span>🔴</span>
              <span>Connecting...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;