import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'task', 'group', 'system', 'reminder'

  // Filter notifications based on read status and type
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read);
    
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    return matchesFilter && matchesType;
  });

  // Get notification counts
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  // Format time ago
  const formatTimeAgo = (timeString) => {
    // This is a simple implementation - you might want to use a library like moment.js
    return timeString;
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task': return '📝';
      case 'group': return '👥';
      case 'course': return '📚';
      case 'system': return '⚙️';
      case 'reminder': return '⏰';
      default: return '📢';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'task': return '#007bff';
      case 'group': return '#28a745';
      case 'course': return '#6f42c1';
      case 'system': return '#6c757d';
      case 'reminder': return '#ffc107';
      default: return '#17a2b8';
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>🔔 Notifications</h1>
        <p>Stay updated with your latest activities and reminders</p>
        <div className="notification-stats">
          <span className="stat">
            <strong>{unreadCount}</strong> unread
          </span>
          <span className="stat">
            <strong>{totalCount}</strong> total
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="notifications-controls">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Filter by status:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Filter by type:</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="task">Tasks</option>
              <option value="group">Groups</option>
              <option value="course">Courses</option>
              <option value="system">System</option>
              <option value="reminder">Reminders</option>
            </select>
          </div>
        </div>

        <div className="action-controls">
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={markAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-container">
        {filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : 'read'}`}
                style={{ borderLeftColor: getNotificationColor(notification.type) }}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    <div className="notification-meta">
                      <span className="notification-type">{notification.type}</span>
                      <span className="notification-time">{formatTimeAgo(notification.time)}</span>
                    </div>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        className="action-btn mark-read"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as Read
                      </button>
                    )}
                    
                    {notification.action && (
                      <button 
                        className="action-btn primary"
                        onClick={notification.action}
                      >
                        View Details
                      </button>
                    )}
                    
                    <button 
                      className="action-btn delete"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {!notification.read && <div className="unread-indicator"></div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No notifications found</h3>
            <p>
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : selectedType !== 'all'
                ? `No ${selectedType} notifications found.`
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="notification-settings">
        <h2>Notification Preferences</h2>
        <div className="settings-grid">
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Task reminders</span>
            </label>
            <p>Get notified about upcoming task deadlines</p>
          </div>
          
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Group activities</span>
            </label>
            <p>Receive updates about your study groups</p>
          </div>
          
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Course updates</span>
            </label>
            <p>Get notified about new course materials</p>
          </div>
          
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>System notifications</span>
            </label>
            <p>Important system updates and announcements</p>
          </div>
          
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Email notifications</span>
            </label>
            <p>Receive notifications via email</p>
          </div>
          
          <div className="setting-item">
            <label>
              <input type="checkbox" defaultChecked />
              <span>Push notifications</span>
            </label>
            <p>Get browser push notifications</p>
          </div>
        </div>
        
        <button className="save-settings-btn">
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default Notifications;