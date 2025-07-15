const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const { authenticateUser } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // 👈 ensure the correct path

// ✅ Update Profile including file upload
router.put('/profile', authenticateUser, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email } = req.body;

    let profilePicture = req.body.profilePicture;

    // ✅ If a new avatar image was uploaded
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }

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

// ✅ Update Privacy Settings
router.put('/privacy', async (req, res) => {
  try {
    const { userId, visibility, activityStatus } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      privacy: { visibility, activityStatus }
    }, { new: true });

    res.json({ message: 'Privacy settings updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: 'Failed to update privacy settings' });
  }
});

// ✅ Update Notification Settings
router.put('/notifications', async (req, res) => {
  try {
    const { userId, emailNotifications, inAppNotifications } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      notifications: { emailNotifications, inAppNotifications }
    }, { new: true });

    res.json({ message: 'Notification settings updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// ✅ Update Security Settings (Password)
router.put('/security', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

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

// ✅ Update Application Settings
router.put('/application', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { theme, language } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.application) user.application = {};
    if (theme !== undefined) user.application.theme = theme;
    if (language !== undefined) user.application.language = language;

    await user.save();

    res.json({ message: 'Application settings updated successfully!', user });
  } catch (error) {
    console.error('Error updating application settings:', error);
    res.status(500).json({ message: 'Failed to update application settings' });
  }
});

module.exports = router;
