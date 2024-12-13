const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  text: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: {
    type: String,
    default: '',  // For text messages and emoji-only messages
  },
  fileUrl: {
    type: String,  // URL to the file attachment (document or image)
  },
  fileType: {
    type: String,  // e.g., 'image' or 'file' to differentiate types
  },
  emojiReactions: [
    {
      emoji: String,
      count: Number,
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
  ],
  timestamp: {
    type: String, 
    required: true,
  },
 }, {
    timestamps: true, // Mongoose automatically adds createdAt and updatedAt timestamps
  });


  const Message = mongoose.model('Message', MessageSchema);

  module.exports = Message;