const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Task = require('../models/Task');
const Message = require('../models/Message');
const crypto = require('crypto');
const { authenticateUser, authorizeAdmin } = require('../middleware/authMiddleware');
// Create a Group

router.post('/create', authenticateUser, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({ success: false, message: 'User is not defined' });
    }

    const { groupName, groupDescription } = req.body;
    const userId = req.user._id; // ✅ Correct MongoDB ObjectId

    const newGroup = await Group.create({
      groupName,
      groupDescription,
      createdBy: userId,
      members: [{ userId, role: 'admin' }],
    });

    await User.findByIdAndUpdate(userId, {
      $push: { groups: newGroup._id },
    });

    const responseGroup = { ...newGroup.toObject(), isCreatedByUser: true };
    res.status(201).json({ success: true, newGroup: responseGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});



// Fetch User's Groups with `isCreatedByUser` Field
router.get('/user-groups', authenticateUser, async (req, res) => {
  try {
    // Fetch groups where the user is a member
    const groups = await Group.find({ 'members.userId': req.user._id })
      .populate('createdBy', 'name email')
      .lean(); // Use `.lean()` for efficiency

    // Add `isCreatedByUser` flag to each group
    const groupsWithFlags = groups.map((group) => ({
      ...group,
      isCreatedByUser: group.createdBy._id.toString() === req.user._id.toString(),
    }));

    res.status(200).json({ success: true, groups: groupsWithFlags });
  } catch (error) {
    console.error('Error fetching user groups:', error); // Log the error for debugging
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/:groupId', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Find the group by ID
    const group = await Group.findById(groupId).populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.status(200).json({
      success: true,
      group: {
        _id: group._id,
        groupName: group.groupName,
        groupDescription: group.groupDescription,
        members: group.members,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error fetching group details:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Generate Invitation Link
router.get('/invite/:groupId', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Check if the user is an admin
    const isAdmin = group.members.some(
      (member) => member.userId.toString() === req.user._id.toString() && member.role === 'admin'
    );

    if (!isAdmin) return res.status(403).json({ success: false, message: 'Only admins can generate invite links' });

    // Generate invitation token with expiration (24 hours from now)
    group.invitationToken = crypto.randomBytes(16).toString('hex');
    group.invitationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await group.save();

    res.status(200).json({ success: true, invitationToken: group.invitationToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Invitation Info (for preview before joining) - NO AUTH REQUIRED
router.get('/invitation-info/:invitationToken', async (req, res) => {
  try {
    const { invitationToken } = req.params;
    console.log('🔍 Getting invitation info for token:', invitationToken);
    
    // Add CORS headers for external access
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    const group = await Group.findOne({ 
      invitationToken,
      $or: [
        { invitationTokenExpiresAt: { $exists: false } }, // No expiration set (old tokens)
        { invitationTokenExpiresAt: { $gt: new Date() } }  // Not expired
      ]
    })
      .populate('createdBy', 'name email')
      .select('groupName groupDescription createdAt members invitationTokenExpiresAt');

    if (!group) {
      console.log('❌ Group not found or token expired for token:', invitationToken);
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired invitation link. Please ask the group creator for a new link.' 
      });
    }

    console.log('✅ Found group:', group.groupName);

    // Return group info for preview (no sensitive data)
    const groupInfo = {
      groupName: group.groupName,
      groupDescription: group.groupDescription,
      createdAt: group.createdAt,
      memberCount: group.members.length,
      creatorName: group.createdBy?.name || 'Unknown',
      invitationToken: invitationToken // Include token for verification
    };

    res.status(200).json({ 
      success: true, 
      group: groupInfo 
    });
  } catch (error) {
    console.error('❌ Error getting invitation info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching invitation info. Please try again later.' 
    });
  }
});

// Join Group
router.post('/join/:invitationToken', authenticateUser, async (req, res) => {
  try {
    const { invitationToken } = req.params;
    console.log('User attempting to join group with token:', invitationToken);
    
    const group = await Group.findOne({ invitationToken });

    if (!group) {
      console.log('Group not found for token:', invitationToken);
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired invitation token' 
      });
    }

    console.log('Found group:', group.groupName, 'User:', req.user.email);

    const alreadyMember = group.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      console.log('User already a member');
      return res.status(400).json({ 
        success: false, 
        message: 'You are already a member of this group' 
      });
    }

    group.members.push({ userId: req.user._id, role: 'member' });
    await group.save();

    console.log('User successfully joined group');
    res.status(200).json({ 
      success: true, 
      message: 'Successfully joined the group!',
      group: {
        id: group._id,
        name: group.groupName
      }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while joining group' 
    });
  }
});


router.delete('/:groupId', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Find and delete the group
    const deletedGroup = await Group.findByIdAndDelete(groupId);
    if (!deletedGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Remove the groupId from users' groups array
    await User.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } }
    );

    // Optionally delete associated tasks and messages
    await Task.deleteMany({ groupId });
    await Message.deleteMany({ groupId });

    res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route: Remove a member from a group
router.delete('/members/:groupId/:memberId', authenticateUser, authorizeAdmin, async (req, res) => {
  const { groupId, memberId } = req.params;

  try {
    if (!memberId) {
      return res.status(400).json({ message: 'Member ID is required' });
    }
    // Find the group by ID
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Ensure videoSessions have valid sessionId
    group.videoSessions.forEach((session, index) => {
      if (!session.sessionId) {
        console.warn(`videoSessions[${index}] missing sessionId, generating default.`);
        session.sessionId = `session-${Date.now()}`;
      }
    });

    // Remove the member from the group
    group.members = group.members.filter((id) => id.toString() !== memberId);

    // Save the updated group
    await group.save();

    res.status(200).json({ message: 'Member removed and related data cleared' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'An error occurred while removing the member', error: error.message });
  }
});


module.exports = router;
