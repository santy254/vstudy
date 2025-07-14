const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    }
  ],
  taskName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'incomplete', 'completed'],
    default: 'pending',
  },
  dueDate: {
    type: Date,
   validate: {
    validator: function (value) {
      // Allow due dates that are either not set or within 1 minute of the current time
      return !value || value.getTime() >= Date.now() - 60000;
    },
  message: 'Due date cannot be in the past.',
},
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      comment: {
        type: String,
        required: true,
        trim: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isNotified: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// Indexes for optimized querying
TaskSchema.index({ groupId: 1, status: 1 }); // Compound index for group and status
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ 'comments.userId': 1 }); // If you need to query comments by user

// Method to add a comment
TaskSchema.methods.addComment = function(userId, comment) {
  this.comments.push({ userId, comment });
  return this.save();
};

// Method to mark task as notified
TaskSchema.methods.markAsNotified = function() {
  this.isNotified = true;
  return this.save();
};

module.exports = mongoose.model('Task', TaskSchema);
