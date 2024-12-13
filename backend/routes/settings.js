const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Update Profile Settings
router.put('/profile', async (req, res) => {
  try {
    const { userId, fullName, email, profilePicture } = req.body;

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(userId, {
      fullName,
      email,
      profilePicture,
    }, { new: true });

    res.json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update Privacy Settings
router.put('/privacy', async (req, res) => {
  try {
    const { userId, visibility, activityStatus } = req.body;

    // Update privacy settings
    const updatedUser = await User.findByIdAndUpdate(userId, {
      privacy: { visibility, activityStatus }
    }, { new: true });

    res.json({ message: 'Privacy settings updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: 'Failed to update privacy settings' });
  }
});

// Update Notification Settings
router.put('/notifications', async (req, res) => {
  try {
    const { userId, emailNotifications, inAppNotifications } = req.body;

    // Update notification settings
    const updatedUser = await User.findByIdAndUpdate(userId, {
      notifications: { emailNotifications, inAppNotifications }
    }, { new: true });

    res.json({ message: 'Notification settings updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// Update Security Settings (Password Change)
router.put('/security', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Find user and verify current password
    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Update Application Settings
router.put('/application', async (req, res) => {
  try {
    const { userId, theme, language } = req.body;

    // Update application settings
    const updatedUser = await User.findByIdAndUpdate(userId, {
      application: { theme, language }
    }, { new: true });

    res.json({ message: 'Application settings updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating application settings:', error);
    res.status(500).json({ message: 'Failed to update application settings' });
  }
});

module.exports = router;
