const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a task (group optional)
router.post('/', authenticateUser, async (req, res) => {
  console.log('Received task data:', req.body);
  console.log('User creating task:', req.user.email);
  
  const { taskName, description, dueDate, priority, groupId } = req.body;
  const createdBy = req.user._id;

  // Enhanced validation
  if (!taskName || !taskName.trim()) {
    return res.status(400).json({ 
      message: 'Task name is required and cannot be empty.',
      error: 'MISSING_TASK_NAME'
    });
  }

  if (!dueDate) {
    return res.status(400).json({ 
      message: 'Due date is required.',
      error: 'MISSING_DUE_DATE'
    });
  }

  if (!priority) {
    return res.status(400).json({ 
      message: 'Priority is required.',
      error: 'MISSING_PRIORITY'
    });
  }

  // Validate priority values
  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ 
      message: 'Priority must be one of: low, medium, high',
      error: 'INVALID_PRIORITY'
    });
  }

  // Validate due date
  const dueDateObj = new Date(dueDate);
  if (isNaN(dueDateObj.getTime())) {
    return res.status(400).json({ 
      message: 'Invalid due date format.',
      error: 'INVALID_DATE'
    });
  }

  // Allow due dates (removed past date restriction for now)
  // You can add this back later if needed with proper timezone handling

  try {
    // Validate group if provided
    if (groupId) {
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ 
          message: 'Invalid group ID format.',
          error: 'INVALID_GROUP_ID'
        });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ 
          message: 'Group not found.',
          error: 'GROUP_NOT_FOUND'
        });
      }

      // Check if user is a member of the group
      const isMember = group.members.some(
        member => member.userId.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        return res.status(403).json({ 
          message: 'You are not a member of this group.',
          error: 'NOT_GROUP_MEMBER'
        });
      }
    }

    const taskData = {
      taskName: taskName.trim(),
      description: description ? description.trim() : '',
      dueDate: dueDateObj,
      priority,
      createdBy,
      status: 'incomplete',
      comments: []
    };

    // Add groupId only if provided
    if (groupId) {
      taskData.groupId = groupId;
    }

    console.log('Creating task with data:', taskData);
    console.log('Due date being saved:', taskData.dueDate);
    console.log('Current time:', new Date());

    const newTask = new Task(taskData);
    const savedTask = await newTask.save();

    // Populate the created task for response
    const populatedTask = await Task.findById(savedTask._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    console.log('Task created successfully:', populatedTask);

    res.status(201).json(populatedTask);
  } catch (err) {
    console.error('Error creating task:', err);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate task detected',
        error: 'DUPLICATE_TASK'
      });
    }

    res.status(500).json({ 
      message: 'Internal server error while creating task',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all tasks
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ createdBy: userId })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${tasks.length} tasks for user ${userId}`);
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching all tasks:', err);
    res.status(500).json({ 
      message: 'Error fetching tasks',
      error: 'FETCH_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Toggle task completion status
router.put('/toggle/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({
      message: 'Invalid task ID format.',
      error: 'INVALID_TASK_ID'
    });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    // Check if user owns the task or has permission to modify it
    let hasPermission = false;
    
    if (task.createdBy.toString() === req.user._id.toString()) {
      hasPermission = true;
    } else if (task.groupId) {
      // Check if user is admin of the group
      const group = await Group.findById(task.groupId);
      if (group) {
        const userMember = group.members.find(
          member => member.userId.toString() === req.user._id.toString()
        );
        hasPermission = userMember && userMember.role === 'admin';
      }
    }

    if (!hasPermission) {
      return res.status(403).json({
        message: 'You do not have permission to update this task',
        error: 'PERMISSION_DENIED'
      });
    }

    // Toggle the task status
    const newStatus = task.status === 'completed' ? 'incomplete' : 'completed';
    task.status = newStatus;
    task.updatedAt = new Date();

    const updatedTask = await task.save();
    
    // Populate the updated task for response
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    console.log(`Task ${taskId} status toggled to: ${newStatus} by user ${req.user.email}`);
    
    // Log completion for analytics
    if (newStatus === 'completed') {
      console.log(`🎉 Task completed: "${task.taskName}" by ${req.user.email}`);
    } else {
      console.log(`🔄 Task marked incomplete: "${task.taskName}" by ${req.user.email}`);
    }
    
    res.status(200).json(populatedTask);
  } catch (err) {
    console.error('Error toggling task status:', err);
    res.status(500).json({
      message: 'Error updating task status',
      error: 'UPDATE_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update an existing task
router.put('/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { taskName, description, dueDate, priority, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({
      message: 'Invalid task ID format.',
      error: 'INVALID_TASK_ID'
    });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    // Check permissions
    let hasPermission = false;
    
    if (task.createdBy.toString() === req.user._id.toString()) {
      hasPermission = true;
    } else if (task.groupId) {
      const group = await Group.findById(task.groupId);
      if (group) {
        const userMember = group.members.find(
          member => member.userId.toString() === req.user._id.toString()
        );
        hasPermission = userMember && userMember.role === 'admin';
      }
    }

    if (!hasPermission) {
      return res.status(403).json({
        message: 'You do not have permission to update this task',
        error: 'PERMISSION_DENIED'
      });
    }

    // Update task fields if provided
    if (taskName !== undefined) {
      if (!taskName || !taskName.trim()) {
        return res.status(400).json({
          message: 'Task name cannot be empty',
          error: 'INVALID_TASK_NAME'
        });
      }
      task.taskName = taskName.trim();
    }

    if (description !== undefined) {
      task.description = description ? description.trim() : '';
    }

    if (dueDate !== undefined) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({
          message: 'Invalid due date format',
          error: 'INVALID_DATE'
        });
      }
      task.dueDate = dueDateObj;
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          message: 'Priority must be one of: low, medium, high',
          error: 'INVALID_PRIORITY'
        });
      }
      task.priority = priority;
    }

    if (status !== undefined) {
      const validStatuses = ['incomplete', 'pending', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Status must be one of: incomplete, pending, completed',
          error: 'INVALID_STATUS'
        });
      }
      task.status = status;
    }

    task.updatedAt = new Date();

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(200).json(populatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({
      message: 'Error updating task',
      error: 'UPDATE_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete a task
router.delete('/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({
      message: 'Invalid task ID format.',
      error: 'INVALID_TASK_ID'
    });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    // Check permissions
    let hasPermission = false;
    
    if (task.createdBy.toString() === req.user._id.toString()) {
      hasPermission = true;
    } else if (task.groupId) {
      const group = await Group.findById(task.groupId);
      if (group) {
        const userMember = group.members.find(
          member => member.userId.toString() === req.user._id.toString()
        );
        hasPermission = userMember && userMember.role === 'admin';
      }
    }

    if (!hasPermission) {
      return res.status(403).json({
        message: 'You do not have permission to delete this task',
        error: 'PERMISSION_DENIED'
      });
    }

    await Task.findByIdAndDelete(taskId);

    // Clean up references in users (if you have this relationship)
    await User.updateMany({ tasks: taskId }, { $pull: { tasks: taskId } });

    res.status(200).json({
      message: 'Task deleted successfully',
      taskId: taskId
    });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({
      message: 'Error deleting task',
      error: 'DELETE_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;