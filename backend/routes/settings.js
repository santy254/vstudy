const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const { authenticateUser } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // 👈 ensure the correct path

// Test route to verify settings routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Settings routes are working!' });
});

// ✅ Update Profile including file upload
router.put('/profile', authenticateUser, upload.single('avatar'), async (req, res) => {
  try {
       
    const userId = req.user._id;
    const { fullName, email } = req.body;

    let profilePicture = req.body.profilePicture;

    // ✅ If a new avatar image was uploaded
    if (req.file) {
      
      profilePicture = `/uploads/${req.file.filename}`;
    }
console.log('Uploaded file:', req.file);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, email, profilePicture },
      { new: true }
    );
console.log('Updated user image:', updatedUser.profilePicture);

    res.json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ✅ Get Privacy Settings
router.get('/privacy', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    res.json({ message: 'Privacy settings retrieved successfully!', user });
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    res.status(500).json({ message: 'Failed to get privacy settings' });
  }
});

// ✅ Update Privacy Settings
router.put('/privacy', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { visibility, activityStatus, dataSharing, analyticsTracking, locationSharing, contactSync } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      privacy: { 
        visibility, 
        activityStatus, 
        dataSharing, 
        analyticsTracking, 
        locationSharing, 
        contactSync 
      }
    }, { new: true });

    res.json({ message: 'Privacy settings updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: 'Failed to update privacy settings' });
  }
});

// ✅ Get Notification Settings
router.get('/notifications', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    res.json({ message: 'Notification settings retrieved successfully!', user });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ message: 'Failed to get notification settings' });
  }
});

// ✅ Update Notification Settings
router.put('/notifications', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      emailNotifications, 
      inAppNotifications, 
      pushNotifications, 
      taskReminders, 
      groupUpdates, 
      courseAnnouncements, 
      weeklyDigest, 
      soundEnabled 
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      notifications: { 
        emailNotifications, 
        inAppNotifications, 
        pushNotifications, 
        taskReminders, 
        groupUpdates, 
        courseAnnouncements, 
        weeklyDigest, 
        soundEnabled 
      }
    }, { new: true });

    res.json({ message: 'Notification settings updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// ✅ Get Security Settings
router.get('/security', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    res.json({ message: 'Security settings retrieved successfully!', user });
  } catch (error) {
    console.error('Error getting security settings:', error);
    res.status(500).json({ message: 'Failed to get security settings' });
  }
});

// ✅ Update Security Settings (Password and Security Options)
router.put('/security', authenticateUser, async (req, res) => {
  try {
    console.log('🔐 Security settings update request received');
    console.log('User:', req.user?.email);
    console.log('Request body:', { ...req.body, currentPassword: req.body.currentPassword ? '[HIDDEN]' : undefined, newPassword: req.body.newPassword ? '[HIDDEN]' : undefined });
    
    const userId = req.user._id;
    const { 
      currentPassword, 
      newPassword, 
      twoFactorAuth, 
      loginAlerts, 
      sessionTimeout, 
      deviceTrust 
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // If password change is requested
    if (currentPassword && newPassword) {
      console.log('🔑 Password change requested');
      
      // Get user with password field (it's normally excluded)
      const userWithPassword = await User.findById(userId).select('+password');
      console.log('✅ User with password retrieved');
      
      const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
      console.log('🔍 Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('❌ Current password is incorrect');
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      console.log('✅ Current password verified, setting new password');
      // Set new password - the pre-save hook will hash it automatically
      user.password = newPassword;
      console.log('✅ New password set (will be hashed on save)');
    }

    // Update security settings
    console.log('🔧 Updating security settings');
    if (!user.security) user.security = {};
    if (twoFactorAuth !== undefined) user.security.twoFactorAuth = twoFactorAuth;
    if (loginAlerts !== undefined) user.security.loginAlerts = loginAlerts;
    if (sessionTimeout !== undefined) user.security.sessionTimeout = sessionTimeout;
    if (deviceTrust !== undefined) user.security.deviceTrust = deviceTrust;

    console.log('💾 Saving user with updated settings');
    await user.save();
    console.log('✅ User saved successfully');

    res.json({ message: 'Security settings updated successfully!', user });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Failed to update security settings' });
  }
});

// ✅ Get Application Settings
router.get('/application', (req, res, next) => {
  console.log('GET /application route hit');
  console.log('Headers:', req.headers.authorization);
  next();
}, authenticateUser, async (req, res) => {
  try {
    console.log('Getting application settings for user:', req.user?.email);
    
    const userId = req.user?._id;
    if (!userId) {
      console.log('No user ID found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current user application settings:', user.application);
    
    res.json({ message: 'Application settings retrieved successfully!', user });
  } catch (error) {
    console.error('Error getting application settings:', error);
    res.status(500).json({ message: 'Failed to get application settings' });
  }
});

// ✅ Update Application Settings
router.put('/application', authenticateUser, async (req, res) => {
  try {
    console.log('Application settings request received');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.email);
    
    const userId = req.user?._id;
    if (!userId) {
      console.log('No user ID found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { theme, language } = req.body;
    console.log('Theme:', theme, 'Language:', language);

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User before update:', user.application);
    
    if (!user.application) user.application = {};
    if (theme !== undefined) user.application.theme = theme;
    if (language !== undefined) user.application.language = language;

    console.log('User after update:', user.application);
    
    await user.save();
    console.log('User saved successfully');

    // Verify the save by fetching the user again
    const verifyUser = await User.findById(userId);
    console.log('Verification - User application settings:', verifyUser.application);

    res.json({ message: 'Application settings updated successfully!', user });
  } catch (error) {
    console.error('Error updating application settings:', error);
    res.status(500).json({ message: 'Failed to update application settings' });
  }
});

module.exports = router;
