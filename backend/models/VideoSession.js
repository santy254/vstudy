const mongoose = require('mongoose');
const { Schema } = mongoose;

const ParticipantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date } // Optional: populated when user leaves the session
});

const ChatMessageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const VideoSessionSchema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true }, // Reference to the group
  hostUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // User who started the session
  participants: [ParticipantSchema], // Embedded array of participants
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date }, // Populated when the session ends
  
  sessionURL: { type: String }, // Optional: URL for recording or additional session info
  chatMessages: [ChatMessageSchema], // Embedded array of chat messages
  status: { type: String, enum: ['active', 'ended'], default: 'active' }
});

// Methods to add participants and messages
VideoSessionSchema.methods.addParticipant = function (userId) {
  this.participants.push({ userId });
  return this.save();
};

VideoSessionSchema.methods.addMessage = function (userId, message) {
  this.chatMessages.push({ userId, message });
  return this.save();
};

// Method to end the session
VideoSessionSchema.methods.endSession = function () {
  this.isActive = false;
  this.endTime = new Date();
  return this.save();
};

const VideoSession = mongoose.model('VideoSession', VideoSessionSchema);

module.exports = VideoSession;
