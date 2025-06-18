const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { authenticateUser } = require('../middleware/authMiddleware'); // make sure it's imported

router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Now this works
    const { fullName, email, profilePicture } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, email, profilePicture },
      { new: true }
    );

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
router.put('/application', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { theme, language } = req.body;

    // ✅ Fetch the user and ensure application object exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Ensure the application object exists
    if (!user.application) {
      user.application = {};
    }

    // ✅ Apply updates only if provided
    if (theme !== undefined) user.application.theme = theme;
    if (language !== undefined) user.application.language = language;

    // ✅ Save the updated user document
    await user.save();

    res.json({
      message: 'Application settings updated successfully!',
      user
    });
  } catch (error) {
    console.error('Error updating application settings:', error);
    res.status(500).json({ message: 'Failed to update application settings' });
  }
});





module.exports = router;
