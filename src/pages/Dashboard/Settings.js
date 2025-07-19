// src/pages/Settings.js
import React, { useState } from 'react';
import api from '../../api'; // Import the custom Axios instance
import { useTheme } from '../../contexts/ThemeContext'; // Import theme context
import { useLanguage } from '../../contexts/LanguageContext'; // Import language context
import './Settings.css';

const Settings = () => {
  const { t } = useLanguage(); // Add language context
  const [activeTab, setActiveTab] = useState('profile');
 const userId = '68516b4e9aa75d9a045fe918'; // <-- Temporary, later use from auth
  const handleSubmit = async (data) => {
    try {
      // For application settings, don't include userId (backend gets it from auth token)
      const payload = activeTab === 'application' ? data : { ...data, userId };
      console.log("Submitting payload:", payload);
     switch (activeTab) {
  case 'profile':
    await api.put('/settings/profile', payload);
    break;
  case 'privacy':
    await api.put('/settings/privacy', payload);
    break;
  case 'notifications':
    await api.put('/settings/notifications', payload);
    break;
  case 'security':
    await api.put('/settings/security', payload);
    break;
  case 'application':
    await api.put('/settings/application', payload);
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
        <h2>{t('settings')}</h2>
        <ul>
          <li
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            {t('profileSettings')}
          </li>
          <li
            className={activeTab === 'privacy' ? 'active' : ''}
            onClick={() => setActiveTab('privacy')}
          >
            {t('privacySettings')}
          </li>
          <li
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => setActiveTab('notifications')}
          >
            {t('notificationSettings')}
          </li>
          <li
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
          >
            {t('securitySettings')}
          </li>
          <li
            className={activeTab === 'application' ? 'active' : ''}
            onClick={() => setActiveTab('application')}
          >
            {t('applicationSettings')}
          </li>
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
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave({ name, email });
  };

  return (
    <div className="settings-section">
      <h3>{t('profileSettings')}</h3>
      <form onSubmit={handleFormSubmit}>
        <label>{t('fullName')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        <label>{t('emailAddress')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit">{t('saveChanges')}</button>
      </form>
    </div>
  );
};

// Privacy Settings Section
const PrivacySettings = ({ onSave }) => {
  const { t } = useLanguage();
  const [visibility, setVisibility] = useState('public');
  const [activityStatus, setActivityStatus] = useState('showWhenActive');
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsTracking, setAnalyticsTracking] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);
  const [contactSync, setContactSync] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load current privacy settings
  React.useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const response = await api.get('/settings/privacy');
        const privacy = response.data.user?.privacy;
        if (privacy) {
          setVisibility(privacy.visibility || 'public');
          setActivityStatus(privacy.activityStatus || 'showWhenActive');
          setDataSharing(privacy.dataSharing || false);
          setAnalyticsTracking(privacy.analyticsTracking !== false);
          setLocationSharing(privacy.locationSharing || false);
          setContactSync(privacy.contactSync || false);
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      }
    };
    loadPrivacySettings();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ 
        visibility, 
        activityStatus, 
        dataSharing, 
        analyticsTracking, 
        locationSharing, 
        contactSync 
      });
      alert('Privacy settings updated successfully!');
    } catch (error) {
      alert('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-header">
        <h3>🔒 {t('privacySettings')}</h3>
        <p>Control how your information is shared and used</p>
      </div>
      
      <form onSubmit={handleFormSubmit} className="enhanced-form">
        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">👁️</span>
            {t('profileVisibility')}
          </label>
          <select 
            value={visibility} 
            onChange={(e) => setVisibility(e.target.value)}
            className="form-select"
          >
            <option value="public">🌍 {t('public')} - Everyone can see your profile</option>
            <option value="private">🔒 {t('private')} - Only you can see your profile</option>
            <option value="onlyFriends">👥 {t('onlyFriends')} - Only friends can see your profile</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">📊</span>
            {t('activityStatus')}
          </label>
          <select 
            value={activityStatus} 
            onChange={(e) => setActivityStatus(e.target.value)}
            className="form-select"
          >
            <option value="showWhenActive">✅ {t('showWhenActive')} - Show when I'm online</option>
            <option value="hideMyActivity">🔇 {t('hideMyActivity')} - Always appear offline</option>
          </select>
        </div>

        <div className="toggle-group">
          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={dataSharing}
                onChange={(e) => setDataSharing(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">📤 Data Sharing</span>
                <span className="toggle-description">Allow sharing anonymized usage data to improve the service</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={analyticsTracking}
                onChange={(e) => setAnalyticsTracking(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">📈 Analytics Tracking</span>
                <span className="toggle-description">Help us improve by tracking how you use the app</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={locationSharing}
                onChange={(e) => setLocationSharing(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">📍 Location Sharing</span>
                <span className="toggle-description">Share your location with study groups and friends</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={contactSync}
                onChange={(e) => setContactSync(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">📱 Contact Sync</span>
                <span className="toggle-description">Sync your contacts to find friends using the app</span>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="save-button" disabled={loading}>
          {loading ? '⏳ Saving...' : '💾 Save Privacy Settings'}
        </button>
      </form>
    </div>
  );
};

// Notification Settings Section
const NotificationSettings = ({ onSave }) => {
  const { t } = useLanguage();
  const [emailNotifications, setEmailNotifications] = useState('allNotifications');
  const [inAppNotifications, setInAppNotifications] = useState('allNotifications');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [groupUpdates, setGroupUpdates] = useState(true);
  const [courseAnnouncements, setCourseAnnouncements] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load current notification settings
  React.useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await api.get('/settings/notifications');
        const notifications = response.data.user?.notifications;
        if (notifications) {
          setEmailNotifications(notifications.emailNotifications || 'allNotifications');
          setInAppNotifications(notifications.inAppNotifications || 'allNotifications');
          setPushNotifications(notifications.pushNotifications !== false);
          setTaskReminders(notifications.taskReminders !== false);
          setGroupUpdates(notifications.groupUpdates !== false);
          setCourseAnnouncements(notifications.courseAnnouncements !== false);
          setWeeklyDigest(notifications.weeklyDigest || false);
          setSoundEnabled(notifications.soundEnabled !== false);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };
    loadNotificationSettings();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ 
        emailNotifications, 
        inAppNotifications,
        pushNotifications,
        taskReminders,
        groupUpdates,
        courseAnnouncements,
        weeklyDigest,
        soundEnabled
      });
      alert('Notification settings updated successfully!');
    } catch (error) {
      alert('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-header">
        <h3>🔔 {t('notificationSettings')}</h3>
        <p>Customize how and when you receive notifications</p>
      </div>
      
      <form onSubmit={handleFormSubmit} className="enhanced-form">
        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">📧</span>
            {t('emailNotifications')}
          </label>
          <select 
            value={emailNotifications} 
            onChange={(e) => setEmailNotifications(e.target.value)}
            className="form-select"
          >
            <option value="allNotifications">📬 {t('allNotifications')} - Get all email notifications</option>
            <option value="onlyMentions">🏷️ {t('onlyMentions')} - Only when mentioned or tagged</option>
            <option value="onlyImportant">⚠️ Important only - Critical updates only</option>
            <option value="none">🚫 {t('none')} - No email notifications</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">📱</span>
            {t('inAppNotifications')}
          </label>
          <select 
            value={inAppNotifications} 
            onChange={(e) => setInAppNotifications(e.target.value)}
            className="form-select"
          >
            <option value="allNotifications">🔔 {t('allNotifications')} - Show all in-app notifications</option>
            <option value="onlyDirectMessages">💬 {t('onlyDirectMessages')} - Direct messages only</option>
            <option value="onlyImportant">⚠️ Important only - Critical updates only</option>
            <option value="none">🔕 {t('none')} - No in-app notifications</option>
          </select>
        </div>

        <div className="toggle-group">
          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">📲 Push Notifications</span>
                <span className="toggle-description">Receive push notifications on your device</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={taskReminders}
                onChange={(e) => setTaskReminders(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">⏰ Task Reminders</span>
                <span className="toggle-description">Get reminded about upcoming deadlines and tasks</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={groupUpdates}
                onChange={(e) => setGroupUpdates(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">👥 Group Updates</span>
                <span className="toggle-description">Notifications about study group activities and messages</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={courseAnnouncements}
                onChange={(e) => setCourseAnnouncements(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">📚 Course Announcements</span>
                <span className="toggle-description">Updates from instructors and course materials</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">📊 Weekly Digest</span>
                <span className="toggle-description">Weekly summary of your activities and progress</span>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <span className="toggle-title">🔊 Notification Sounds</span>
                <span className="toggle-description">Play sounds when receiving notifications</span>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="save-button" disabled={loading}>
          {loading ? '⏳ Saving...' : '🔔 Save Notification Settings'}
        </button>
      </form>
    </div>
  );
};

// Security Settings Section
const SecuritySettings = ({ onSave }) => {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [deviceTrust, setDeviceTrust] = useState(true);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Load current security settings
  React.useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const response = await api.get('/settings/security');
        const security = response.data.user?.security;
        if (security) {
          setTwoFactorAuth(security.twoFactorAuth || false);
          setLoginAlerts(security.loginAlerts !== false);
          setSessionTimeout(security.sessionTimeout || '30');
          setDeviceTrust(security.deviceTrust !== false);
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };
    loadSecuritySettings();
  }, []);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordStrength(checkPasswordStrength(password));
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return { text: 'Very Weak', color: '#ff4757' };
      case 2: return { text: 'Weak', color: '#ff6b35' };
      case 3: return { text: 'Fair', color: '#ffa502' };
      case 4: return { text: 'Good', color: '#26de81' };
      case 5: return { text: 'Strong', color: '#20bf6b' };
      default: return { text: '', color: '' };
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (newPassword && newPassword !== confirmPassword) {
        alert(t('passwordMismatch'));
        setLoading(false);
        return;
      }
      
      if (newPassword && passwordStrength < 3) {
        alert('Password is too weak. Please use a stronger password.');
        setLoading(false);
        return;
      }

      const securityData = {
        twoFactorAuth,
        loginAlerts,
        sessionTimeout,
        deviceTrust
      };

      if (currentPassword && newPassword) {
        securityData.currentPassword = currentPassword;
        securityData.newPassword = newPassword;
      }

      await onSave(securityData);
      alert('Security settings updated successfully!');
      
      // Clear password fields after successful update
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(0);
      
    } catch (error) {
      alert('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const strengthInfo = getPasswordStrengthText();

  return (
    <div className="settings-section">
      <div className="settings-header">
        <h3>🔐 {t('securitySettings')}</h3>
        <p>Protect your account with advanced security features</p>
      </div>
      
      <form onSubmit={handleFormSubmit} className="enhanced-form">
        <div className="password-section">
          <h4>🔑 Change Password</h4>
          
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🔒</span>
              {t('currentPassword')}
            </label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your current password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🆕</span>
              {t('newPassword')}
            </label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={handlePasswordChange}
              className="form-input"
              placeholder="Enter a strong new password"
            />
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: strengthInfo.color 
                    }}
                  ></div>
                </div>
                <span style={{ color: strengthInfo.color, fontSize: '0.9em' }}>
                  {strengthInfo.text}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">✅</span>
              {t('confirmPassword')}
            </label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirm your new password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <span style={{ color: '#ff4757', fontSize: '0.9em' }}>
                Passwords do not match
              </span>
            )}
          </div>
        </div>

        <div className="security-options">
          <h4>🛡️ Security Options</h4>
          
          <div className="toggle-group">
            <div className="toggle-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-title">🔐 Two-Factor Authentication</span>
                  <span className="toggle-description">Add an extra layer of security to your account</span>
                </div>
              </label>
            </div>

            <div className="toggle-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={loginAlerts}
                  onChange={(e) => setLoginAlerts(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-title">🚨 Login Alerts</span>
                  <span className="toggle-description">Get notified when someone logs into your account</span>
                </div>
              </label>
            </div>

            <div className="toggle-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={deviceTrust}
                  onChange={(e) => setDeviceTrust(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-title">📱 Trust This Device</span>
                  <span className="toggle-description">Remember this device for faster login</span>
                </div>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">⏱️</span>
              Session Timeout
            </label>
            <select 
              value={sessionTimeout} 
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="form-select"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="480">8 hours</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>

        <button type="submit" className="save-button" disabled={loading}>
          {loading ? '⏳ Saving...' : '🔐 Save Security Settings'}
        </button>
      </form>
    </div>
  );
};

const ApplicationSettings = ({ onSave, userId }) => {
  const { updateTheme } = useTheme(); // Get theme context
  const { updateLanguage, t } = useLanguage(); // Get language context
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Add this to force re-render

  // Load current settings when component mounts
  React.useEffect(() => {
    const loadCurrentSettings = async () => {
      try {
        // Check if we have a token before making the request
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping settings load');
          setLoading(false);
          return;
        }

        console.log('Loading application settings...');
        const response = await api.get('/settings/application');
        console.log('Settings response:', response.data);
        
        const userSettings = response.data.user?.application;
        if (userSettings) {
          console.log('User settings from database:', userSettings);
          // Map database values to display values
          const themeMap = { 'light': 'light', 'dark': 'dark' };
          const languageMap = { 'en': 'en', 'es': 'es', 'fr': 'fr', 'de': 'de' };
          
          setTheme(themeMap[userSettings.theme] || 'light');
          setLanguage(languageMap[userSettings.language] || 'en');
          console.log('UI updated with theme:', themeMap[userSettings.theme], 'language:', languageMap[userSettings.language]);
        }
      } catch (error) {
        console.error('Error loading current settings:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };
    loadCurrentSettings();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const data = {};
    if (theme) data.theme = theme;
    if (language) data.language = language;

    if (Object.keys(data).length === 0) {
      alert('No application settings to update');
      return;
    }

    try {
      await onSave(data);
      console.log('Settings updated successfully in UI');
      
      // Apply the theme immediately to the entire app
      if (data.theme) {
        updateTheme(data.theme);
        console.log('Applied theme to entire app:', data.theme);
      }
      
      // Apply the language immediately to the entire app
      if (data.language) {
        updateLanguage(data.language);
        console.log('Applied language to entire app:', data.language);
      }
      
      // Force a complete re-render by incrementing the refresh key
      setRefreshKey(prev => prev + 1);
      
      console.log('Current state after save - theme:', theme, 'language:', language);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="settings-section">
        <h3>Application Settings</h3>
        <p>Loading current settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h3>{t('applicationSettings')}</h3>
      <form key={refreshKey} onSubmit={handleFormSubmit}>
        <label>{t('theme')}</label>
        <select value={theme || ''} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">{t('lightMode')}</option>
          <option value="dark">{t('darkMode')}</option>
        </select>
        
        <label>{t('language')}</label>
        <select value={language || ''} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
        
        <div style={{marginTop: '10px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--text-primary)'}}>
          <strong>{t('currentSettings')}:</strong><br/>
          {t('theme')}: {theme === 'light' ? t('lightMode') : t('darkMode')}<br/>
          {t('language')}: {language === 'en' ? 'English' : language === 'es' ? 'Español' : language === 'fr' ? 'Français' : 'Deutsch'}
        </div>
        <button type="submit">{t('saveChanges')}</button>
      </form>
    </div>
  );
};


export default Settings;
