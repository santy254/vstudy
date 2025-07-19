import React, { useState, useEffect } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import './RealTimeWidget.css';

const RealTimeWidget = () => {
  const { stats, formatTime, lastUpdated } = useDashboard();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionTime, setSessionTime] = useState(0);
  const [liveStats, setLiveStats] = useState({
    tasksPerMinute: 0,
    productivityScore: 0,
    focusLevel: 'High',
    streakStatus: 'Active'
  });

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate live productivity metrics
  useEffect(() => {
    const calculateLiveMetrics = () => {
      const tasksToday = stats.tasks.completedToday || 0;
      const minutesToday = Math.max(sessionTime, 1);
      const tasksPerMinute = (tasksToday / minutesToday * 60).toFixed(2);
      
      // Calculate productivity score based on tasks completed vs time
      const productivityScore = Math.min(
        Math.round((tasksToday / Math.max(minutesToday / 60, 0.1)) * 20), 
        100
      );
      
      // Determine focus level based on recent activity
      const focusLevel = productivityScore >= 80 ? 'High' : 
                        productivityScore >= 50 ? 'Medium' : 'Low';
      
      // Check streak status
      const streakStatus = stats.activity.studyStreak >= 7 ? 'Fire' :
                          stats.activity.studyStreak >= 3 ? 'Active' : 'Building';

      setLiveStats({
        tasksPerMinute,
        productivityScore,
        focusLevel,
        streakStatus
      });
    };

    calculateLiveMetrics();
  }, [stats, sessionTime]);

  const getStatusColor = (level) => {
    switch (level) {
      case 'High': case 'Fire': return '#28a745';
      case 'Medium': case 'Active': return '#ffc107';
      case 'Low': case 'Building': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (level) => {
    switch (level) {
      case 'High': return '🚀';
      case 'Medium': return '⚡';
      case 'Low': return '🐌';
      case 'Fire': return '🔥';
      case 'Active': return '✅';
      case 'Building': return '🏗️';
      default: return '📊';
    }
  };

  return (
    <div className="real-time-widget">
      <div className="widget-header">
        <h3>⚡ Live Dashboard</h3>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>LIVE</span>
        </div>
      </div>

      <div className="widget-content">
        <div className="time-section">
          <div className="current-time">
            <span className="time-value">{currentTime.toLocaleTimeString()}</span>
            <span className="time-label">Current Time</span>
          </div>
          <div className="session-time">
            <span className="time-value">{formatTime(sessionTime)}</span>
            <span className="time-label">Session Time</span>
          </div>
        </div>

        <div className="metrics-section">
          <div className="metric-item">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <span className="metric-value">{liveStats.tasksPerMinute}</span>
              <span className="metric-label">Tasks/Hour</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <span className="metric-value">{liveStats.productivityScore}%</span>
              <span className="metric-label">Productivity</span>
            </div>
          </div>

          <div className="metric-item">
            <div 
              className="metric-icon"
              style={{ color: getStatusColor(liveStats.focusLevel) }}
            >
              {getStatusIcon(liveStats.focusLevel)}
            </div>
            <div className="metric-content">
              <span 
                className="metric-value"
                style={{ color: getStatusColor(liveStats.focusLevel) }}
              >
                {liveStats.focusLevel}
              </span>
              <span className="metric-label">Focus Level</span>
            </div>
          </div>

          <div className="metric-item">
            <div 
              className="metric-icon"
              style={{ color: getStatusColor(liveStats.streakStatus) }}
            >
              {getStatusIcon(liveStats.streakStatus)}
            </div>
            <div className="metric-content">
              <span 
                className="metric-value"
                style={{ color: getStatusColor(liveStats.streakStatus) }}
              >
                {stats.activity.studyStreak}d
              </span>
              <span className="metric-label">Streak</span>
            </div>
          </div>
        </div>

        <div className="status-section">
          <div className="status-item">
            <span className="status-label">Tasks Today:</span>
            <span className="status-value">{stats.tasks.completedToday}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Weekly Goal:</span>
            <span className="status-value">{stats.activity.weeklyProgress}%</span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Update:</span>
            <span className="status-value">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-item">
            <span className="progress-label">Daily Goal Progress</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((sessionTime / 120) * 100, 100)}%`,
                  background: `linear-gradient(90deg, 
                    ${getStatusColor(liveStats.focusLevel)}, 
                    ${getStatusColor(liveStats.focusLevel)}aa)`
                }}
              ></div>
            </div>
            <span className="progress-percentage">
              {Math.min(Math.round((sessionTime / 120) * 100), 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeWidget;