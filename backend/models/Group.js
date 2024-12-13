
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true, trim: true, unique: true },
  groupDescription: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    _id: false
  }],
  invitationToken: { type: String, index: true },
  invitationTokenExpiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  videoSessions: [{
    sessionId: { type: String, required: true },
    sessionName: { type: String, trim: true },
    startTime: { type: Date },
    endTime: { type: Date }
  }],

  
});

// Unique constraint on members
GroupSchema.index({ _id: 1, 'members.userId': 1 }, { unique: true });

// TTL index on invitationTokenExpiresAt
GroupSchema.index({ invitationTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if a user is an admin
GroupSchema.methods.isAdmin = function(userId) {
  return this.members.some(member => member.userId.toString() === userId.toString() && member.role === 'admin');
};

const Group = mongoose.model('Group', GroupSchema);
module.exports = Group;
