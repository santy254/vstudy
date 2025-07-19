import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Analytics.css';

const Analytics = () => {
  const { stats, getWeeklyActivityChart, formatTime, lastUpdated, refreshStats } = useDashboard();
  const { notifications } = useNotifications();
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('tasks');
  const [realTimeData, setRealTimeData] = useState({
    currentTime: new Date(),
    sessionTime: 0,
    tasksCompletedToday: 0,
    activeUsers: 0
  });

  // Real-time clock and session tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        currentTime: new Date(),
        sessionTime: prev.sessionTime + 1,
        // Simulate real-time data updates
        tasksCompletedToday: stats.tasks.completedToday + Math.floor(Math.random() * 2),
        activeUsers: Math.floor(Math.random() * 10) + 15
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.tasks.completedToday]);

  // Auto-refresh analytics data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  const weeklyChart = getWeeklyActivityChart();

  // Calculate additional analytics
  const calculateProductivityTrends = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      tasksThisWeek: stats.tasks.thisWeek || 0,
      tasksLastWeek: Math.max(0, (stats.tasks.total || 0) - (stats.tasks.thisWeek || 0)),
      completionTrend: stats.tasks.completionRate > 75 ? 'improving' : 'stable',
      mostProductiveDay: weeklyChart.reduce((max, day) => 
        day.activity > max.activity ? day : max, weeklyChart[0] || { day: 'Monday', activity: 0 }
      )
    };
  };

  const trends = calculateProductivityTrends();

  const getMotivationalInsight = () => {
    const rate = stats.tasks.completionRate;
    if (rate >= 90) return { message: "🌟 Outstanding! You're crushing your goals!", color: '#28a745' };
    if (rate >= 75) return { message: "🚀 Great work! Keep up the momentum!", color: '#17a2b8' };
    if (rate >= 50) return { message: "💪 Good progress! You're on the right track!", color: '#ffc107' };
    return { message: "🎯 Every step counts! Keep pushing forward!", color: '#fd7e14' };
  };

  const insight = getMotivationalInsight();

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>📊 Analytics & Reports</h1>
        <p>Detailed insights into your productivity and progress</p>
      </div>

      {/* Real-time Status Bar */}
      <div className="real-time-status">
        <div className="status-item">
          <span className="status-icon">🕐</span>
          <span className="status-label">Current Time</span>
          <span className="status-value">{realTimeData.currentTime.toLocaleTimeString()}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">⏱️</span>
          <span className="status-label">Session Time</span>
          <span className="status-value">{formatTime(realTimeData.sessionTime)}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span className="status-label">Tasks Today</span>
          <span className="status-value">{stats.tasks.completedToday}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">👥</span>
          <span className="status-label">Active Users</span>
          <span className="status-value">{realTimeData.activeUsers}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">🔄</span>
          <span className="status-label">Last Updated</span>
          <span className="status-value">{lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</span>
        </div>
      </div>

      {/* Motivational Insight */}
      <div className="insight-card" style={{ borderLeftColor: insight.color }}>
        <div className="insight-content">
          <h3>💡 Your Progress Insight</h3>
          <p style={{ color: insight.color, fontSize: '1.1rem', fontWeight: '600' }}>
            {insight.message}
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        <button 
          className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
          onClick={() => setTimeRange('week')}
        >
          This Week
        </button>
        <button 
          className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          This Month
        </button>
        <button 
          className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
          onClick={() => setTimeRange('year')}
        >
          This Year
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card tasks">
          <div className="metric-header">
            <h3>📝 Task Performance</h3>
            <span className="metric-trend up">↗️ +{trends.tasksThisWeek - trends.tasksLastWeek}</span>
          </div>
          <div className="metric-body">
            <div className="metric-value">{stats.tasks.completed}/{stats.tasks.total}</div>
            <div className="metric-label">Completed Tasks</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.tasks.completionRate}%` }}
              ></div>
            </div>
            <div className="metric-details">
              <span>Completion Rate: {stats.tasks.completionRate}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card productivity">
          <div className="metric-header">
            <h3>⚡ Productivity Score</h3>
            <span className="metric-trend stable">📊 Stable</span>
          </div>
          <div className="metric-body">
            <div className="metric-value">{Math.round(stats.tasks.completionRate * 0.8 + stats.activity.weeklyProgress * 0.2)}</div>
            <div className="metric-label">Overall Score</div>
            <div className="score-breakdown">
              <div>Task Completion: {stats.tasks.completionRate}%</div>
              <div>Weekly Goal: {stats.activity.weeklyProgress}%</div>
            </div>
          </div>
        </div>

        <div className="metric-card streak">
          <div className="metric-header">
            <h3>🔥 Study Streak</h3>
            <span className="metric-trend up">🔥 Hot</span>
          </div>
          <div className="metric-body">
            <div className="metric-value">{stats.activity.studyStreak}</div>
            <div className="metric-label">Days in a Row</div>
            <div className="streak-visual">
              {[...Array(Math.min(stats.activity.studyStreak, 7))].map((_, i) => (
                <span key={i} className="streak-day">🔥</span>
              ))}
            </div>
          </div>
        </div>

        <div className="metric-card groups">
          <div className="metric-header">
            <h3>👥 Group Activity</h3>
            <span className="metric-trend stable">👥 Active</span>
          </div>
          <div className="metric-body">
            <div className="metric-value">{stats.groups.active}</div>
            <div className="metric-label">Active Groups</div>
            <div className="group-details">
              <div>Created: {stats.groups.created}</div>
              <div>Messages: {stats.activity.messagesThisWeek} this week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="chart-section">
        <h3>📈 Weekly Activity Breakdown</h3>
        <div className="activity-chart">
          <div className="chart-container">
            {weeklyChart.map((day, index) => (
              <div key={index} className="chart-day">
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${day.percentage}%`,
                    backgroundColor: day.day === trends.mostProductiveDay.day ? '#28a745' : '#007bff'
                  }}
                  title={`${day.day}: ${day.activity} activities`}
                ></div>
                <div className="chart-label">{day.day}</div>
                <div className="chart-value">{day.activity}</div>
              </div>
            ))}
          </div>
          <div className="chart-insights">
            <p>🏆 Most productive day: <strong>{trends.mostProductiveDay.day}</strong></p>
            <p>📊 Average daily activity: <strong>{Math.round(weeklyChart.reduce((sum, day) => sum + day.activity, 0) / 7)}</strong></p>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="detailed-stats">
        <h3>📋 Detailed Statistics</h3>
        <div className="stats-table">
          <div className="stat-row">
            <span className="stat-label">Total Tasks Created</span>
            <span className="stat-value">{stats.tasks.total}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Tasks Completed Today</span>
            <span className="stat-value">{stats.tasks.completedToday}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Tasks This Week</span>
            <span className="stat-value">{stats.tasks.thisWeek}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Average Completion Time</span>
            <span className="stat-value">~2.5 hours</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Most Used Priority</span>
            <span className="stat-value">Medium</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Notifications Received</span>
            <span className="stat-value">{notifications.length}</span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="export-section">
        <h3>📤 Export Reports</h3>
        <div className="export-buttons">
          <button className="export-btn pdf">
            📄 Export as PDF
          </button>
          <button className="export-btn csv">
            📊 Export as CSV
          </button>
          <button className="export-btn email">
            📧 Email Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;