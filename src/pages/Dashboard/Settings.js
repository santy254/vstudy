// src/pages/Settings.js
import React, { useState } from 'react';
import api from '../../api'; // Import the custom Axios instance
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
 const userId = '68516b4e9aa75d9a045fe918'; // <-- Temporary, later use from auth
  const handleSubmit = async (data) => {
    try {
      const payload = { ...data, userId };
      switch (activeTab) {
        case 'profile':
          await api.put('/settings/profile', data);
          break;
        case 'privacy':
          await api.put('/settings/privacy', data);
          break;
        case 'notifications':
          await api.put('/settings/notifications', data);
          break;
        case 'security':
          await api.put('/settings/security', data);
          break;
        case 'application':
          await api.put('/settings/application', data);
          break;
        default:
          break;
      }
      alert('Settings updated successfully!');
    } catch (error) {
      console.error(`Error updating ${activeTab} settings:`, error);
      alert(`Failed to update ${activeTab} settings`);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <h2>Settings</h2>
        <ul>
          {['profile', 'privacy', 'notifications', 'security', 'application'].map((tab) => (
            <li
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Settings
            </li>
          ))}
        </ul>
      </div>
      <div className="settings-content">{renderContent()}</div>
    </div>
  );

  function renderContent() {
  const sharedProps = { onSave: handleSubmit };

  switch (activeTab) {
    case 'profile':
      return <ProfileSettings {...sharedProps} />;
    case 'privacy':
      return <PrivacySettings {...sharedProps} />;
    case 'notifications':
      return <NotificationSettings {...sharedProps} />;
    case 'security':
      return <SecuritySettings {...sharedProps} />;
    case 'application':
      return <ApplicationSettings {...sharedProps} userId={userId} />;
    default:
      return <ProfileSettings {...sharedProps} />;
  }
}

};

// Profile Settings Section
const ProfileSettings = ({ onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave({ name, email });
  };

  return (
    <div className="settings-section">
      <h3>Profile Settings</h3>
      <form onSubmit={handleFormSubmit}>
        <label>Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        <label>Email Address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

// Privacy Settings Section
const PrivacySettings = ({ onSave }) => {
  const [visibility, setVisibility] = useState('Public');
  const [activityStatus, setActivityStatus] = useState('Show when active');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave({ visibility, activityStatus });
  };

  return (
    <div className="settings-section">
      <h3>Privacy Settings</h3>
      <form onSubmit={handleFormSubmit}>
        <label>Profile Visibility</label>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option>Public</option>
          <option>Private</option>
          <option>Only Friends</option>
        </select>
        <label>Activity Status</label>
        <select value={activityStatus} onChange={(e) => setActivityStatus(e.target.value)}>
          <option>Show when active</option>
          <option>Hide my activity</option>
        </select>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

// Notification Settings Section
const NotificationSettings = ({ onSave }) => {
  const [emailNotifications, setEmailNotifications] = useState('All Notifications');
  const [inAppNotifications, setInAppNotifications] = useState('All Notifications');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave({ emailNotifications, inAppNotifications });
  };

  return (
    <div className="settings-section">
      <h3>Notification Settings</h3>
      <form onSubmit={handleFormSubmit}>
        <label>Email Notifications</label>
        <select value={emailNotifications} onChange={(e) => setEmailNotifications(e.target.value)}>
          <option>All Notifications</option>
          <option>Only Mentions</option>
          <option>None</option>
        </select>
        <label>In-App Notifications</label>
        <select value={inAppNotifications} onChange={(e) => setInAppNotifications(e.target.value)}>
          <option>All Notifications</option>
          <option>Only Direct Messages</option>
          <option>None</option>
        </select>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

// Security Settings Section
const SecuritySettings = ({ onSave }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match');
      return;
    }
    onSave({ currentPassword, newPassword });
  };

  return (
    <div className="settings-section">
      <h3>Security Settings</h3>
      <form onSubmit={handleFormSubmit}>
        <label>Current Password</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <label>New Password</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
};

const ApplicationSettings = ({ onSave, userId }) => {
  const [theme, setTheme] = useState('Light Mode');
  const [language, setLanguage] = useState('English');

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const data = { userId };
    if (theme) data.theme = theme;
    if (language) data.language = language;

    if (Object.keys(data).length <= 1) {
      alert('No application settings to update');
      return;
    }

    onSave(data);
  };

  return (
    <div className="settings-section">
      <h3>Application Settings</h3>
      <form onSubmit={handleFormSubmit}>
        <label>Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option>Light Mode</option>
          <option>Dark Mode</option>
        </select>
        <label>Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};


export default Settings;
