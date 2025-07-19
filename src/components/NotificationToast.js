import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationToast.css';

const NotificationToast = () => {
  const { notifications } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // Show only the most recent unread notifications as toasts
    const recentUnread = notifications
      .filter(n => !n.read)
      .slice(0, 3) // Show max 3 toasts at once
      .filter(n => {
        // Only show notifications from the last 30 seconds
        const notificationTime = new Date(n.createdAt);
        const now = new Date();
        return (now - notificationTime) < 30000;
      });

    setVisibleNotifications(recentUnread);

    // Auto-hide notifications after 5 seconds
    if (recentUnread.length > 0) {
      const timer = setTimeout(() => {
        setVisibleNotifications([]);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleClose = (notificationId) => {
    setVisibleNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="notification-toast-container">
      {visibleNotifications.map((notification) => (
        <div 
          key={notification.id}
          className={`notification-toast ${notification.type}`}
        >
          <div className="toast-icon">
            {notification.type === 'task' && '📝'}
            {notification.type === 'group' && '👥'}
            {notification.type === 'message' && '💬'}
            {notification.type === 'system' && '⚙️'}
            {notification.type === 'reminder' && '⏰'}
            {!['task', 'group', 'message', 'system', 'reminder'].includes(notification.type) && '📢'}
          </div>
          <div className="toast-content">
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <span className="toast-time">{notification.time}</span>
          </div>
          <button 
            className="toast-close"
            onClick={() => handleClose(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;