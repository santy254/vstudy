import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const TopNav = ({ toggleSearch, onSearch }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    if (toggleSearch) toggleSearch();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleNotificationToggle = () => {
    setIsNotificationVisible(!isNotificationVisible);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action) {
      notification.action();
    }
  };

  return (
    <header className="top-nav">
      <h2>Dashboard</h2>
      <div className="nav-actions">
        <div className="search-container">
          {isSearchVisible && (
            <form onSubmit={handleSearchSubmit} className="search-form">
              <input
                type="text"
                className="search-bar"
                placeholder="Search courses, tasks, or content..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
            </form>
          )}
          <button 
            className="search-icon" 
            onClick={handleSearchToggle}
            title="Toggle Search"
          >
            🔍
          </button>
        </div>
        <div className="notification-container">
          <button 
            className="notifications-icon" 
            onClick={handleNotificationToggle}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {isNotificationVisible && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                <span className="notification-count">{notifications.length} total</span>
              </div>
              
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <span>🔕</span>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {notification.type === 'task' && '✅'}
                        {notification.type === 'course' && '📚'}
                        {notification.type === 'group' && '👥'}
                        {notification.type === 'system' && '⚙️'}
                        {notification.type === 'reminder' && '⏰'}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                      {!notification.read && <div className="unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="notification-footer">
                  <button 
                    className="mark-all-read"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
