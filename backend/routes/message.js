const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateUser } = require('../middleware/authMiddleware');
const Message = require('../models/Message'); // Import Message model
const Group = require('../models/Group'); // Import Group model
const router = express.Router();
const User = require('../models/User');

// Set up multer for file uploads, saving to the 'backend/uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); 
  },
  filename: (req, file, cb) => {
    // Set a unique filename for each uploaded file
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });


// Route for fetching messages by groupId with sender's name populated
router.get('/group/:groupId', authenticateUser, async (req, res) => {
  const { groupId } = req.params;

  try {
    console.log(`Fetching messages for group ID: ${groupId}`);
    
    // Check if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Fetch messages for the group, sorting by creation date, and populate sender and emoji reaction users' names
    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name')
      .populate('emojiReactions.users', 'name');
  
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});
router.post('/', authenticateUser, async (req, res) => { 
  const { groupId, sender, content, timestamp, createdBy } = req.body;

  // Validate required fields
  if (!groupId || !sender || !content || !timestamp || !createdBy) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const user = await User.findOne({ name: sender });
    if (!user) {
      return res.status(400).json({ message: 'Sender not found' });
    }

    const newMessage = new Message({
      groupId,
      sender: user._id, // Ensure sender is stored as ObjectId
      content,
      timestamp,
      createdBy: user._id, // Store createdBy as the user's ObjectId
    });

    const savedMessage = await newMessage.save();
    group.messages.push(savedMessage._id);
    await group.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
});


router.post('/upload', authenticateUser, upload.single('file'), async (req, res) => {
  const { groupId, sender, timestamp, createdBy } = req.body;

  if (!req.file || !createdBy) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const fileType = req.file.mimetype.startsWith('image') ? 'image' : 'file';

  try {
    const user = await User.findOne({ name: sender });
    if (!user) {
      return res.status(400).json({ message: 'Sender not found' });
    }

    const newMessage = new Message({
      groupId,
      sender: user._id, // Store sender as ObjectId
      content: '', // Empty content since the message is a file
      fileUrl,
      fileType,
      timestamp,
      createdBy: user._id, // Store createdBy as the user's ObjectId
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Extract userId from the token

    // Fetch messages based on the userId
    const messages = await Message.find({ sender: userId })
    .populate({ path: 'createdBy', select: 'name', strictPopulate: false })
  .exec();

    res.status(200).json({ messages });
  } catch (err) {
    console.error('Error fetching all messages:', err.message);
    res.status(500).json({ message: 'Error fetching all messages', error: err.message });
  }
});

// Add an emoji reaction to a message
router.post('/:messageId/reactions', authenticateUser, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user.id;

  try {
    const message = await Message.findOneAndUpdate(
      { _id: messageId, 'emojiReactions.emoji': emoji },
      {
        $addToSet: { 'emojiReactions.$.users': userId },
        $inc: { 'emojiReactions.$.count': 1 },
      },
      { new: true }
    );

    // If the emoji does not exist, add it as a new reaction
    if (!message) {
      await Message.findByIdAndUpdate(
        messageId,
        {
          $push: {
            emojiReactions: { emoji, count: 1, users: [userId] },
          },
        },
        { new: true }
      );
    }

    res.status(200).json({ message: 'Reaction added' });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Failed to add reaction' });
  }
});

// Remove an emoji reaction
router.delete('/:messageId/reactions', authenticateUser, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user.id;

  try {
    await Message.findOneAndUpdate(
      { _id: messageId, 'emojiReactions.emoji': emoji },
      {
        $pull: { 'emojiReactions.$.users': userId },
        $inc: { 'emojiReactions.$.count': -1 },
      },
      { new: true }
    );

    res.status(200).json({ message: 'Reaction removed' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ message: 'Failed to remove reaction' });
  }
});


module.exports = router;
