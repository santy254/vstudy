// src/pages/dashboard/NotificationCenter.js
import React, { useEffect, useState } from 'react';
import api from '../../api'; // Centralized Axios instance
import './NotificationCenter.css'; // Optional CSS file

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch user notifications on component load
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div className="notification-center">
      <h2>Notification Center</h2>
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((notification, index) => (
            <li key={index} className={`notification-item ${notification.read ? '' : 'unread'}`}>
              <span className="notification-type">{notification.type.toUpperCase()}</span>
              <p>{notification.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No notifications to display.</p>
      )}
    </div>
  );
};

export default NotificationCenter;
