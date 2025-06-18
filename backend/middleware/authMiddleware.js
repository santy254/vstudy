const jwt = require('jsonwebtoken');
const Group = require('../models/Group');
const User = require('../models/User');


// Authenticate User Middleware
const authenticateUser = async (req, res, next) => {
 
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = decoded.id; // ✅ NOT decoded.user.id
  // Assuming user.id is either ObjectId or string
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Authorize Admin Middleware
const authorizeAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(
      (member) => member.userId.toString() === userId.toString() && member.role === 'admin'
    );

    if (!isAdmin) return res.status(403).json({ message: 'Access denied, admin privileges required' });

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during authorization' });
  }
};

module.exports = { authenticateUser, authorizeAdmin };
