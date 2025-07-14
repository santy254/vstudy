// routes/taskRoute.js
const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a task
router.post('/', authenticateUser, async (req, res) => {
  const { taskName, description, dueDate, priority, groupId, assignedTo } = req.body;
  const createdBy = req.user.id;

  if (!taskName || !dueDate || !priority || !groupId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const newTask = await Task.create({
    taskName,
    description,
    dueDate,
    priority,
    groupId,
    assignedTo,
    status: 'incomplete',
    comments: []
  });

  res.status(201).json({ task: newTask });

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if the user is an admin in the group
    const isAdmin = group.members.some(
      (member) => member.userId.toString() === req.user.id && member.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can create tasks' });
    }

    // Create a new task
    const newTask = new Task({
      taskName,
      description,
      dueDate,
      priority,
      groupId,
      createdBy,
    });

    const savedTask = await newTask.save();

    // Add the task to the group's task list
    group.tasks.push(savedTask._id);
    await group.save();

    res.status(201).json({ message: 'Task created successfully', task: savedTask });
  } catch (err) {
    console.error('Error creating task:', err.message);
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

// Get all tasks (for dashboard overview)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Extract userId from the token

  
    const tasks = await Task.find({ sender: userId }).populate('createdBy', 'name');
    
    res.status(200).json({ tasks });
  } catch (err) {
    console.error('Error fetching all tasks:', err.message);
    res.status(500).json({ message: 'Error fetching all tasks', error: err.message });
  }
});


// Get tasks for a specific group
router.get('/group/:groupId', authenticateUser, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Fetch the group by its ID
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Find if the current user is an admin in the group
    const isAdmin = group.members.some(
      (member) => member.userId.toString() === req.user.id && member.role === 'admin'
    );

    // Fetch tasks for the group
    const tasks = await Task.find({ groupId })
    .populate('createdBy', 'name')
    .populate('assignedTo', 'name email') // Populate assigned user details
      .exec();

    // Return the tasks and the admin status of the current user
    res.status(200).json({ tasks, isAdmin: isAdmin });
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// Update an existing task
router.put('/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { taskName, description, dueDate, priority, status } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const group = await Group.findById(task.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(member => member.userId.toString() === req.user.id && member.role === 'admin');

    if (task.createdBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }

    task.taskName = taskName || task.taskName;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;
    task.status = status || task.status;
    task.updatedAt = Date.now();

    const updatedTask = await task.save();
    res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ message: 'Error updating task', error: err.message });
  }
});

// Delete a task
router.delete('/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const group = await Group.findById(task.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(
      (member) => member.userId.toString() === req.user.id && member.role === 'admin'
    );

    if (task.createdBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this task' });
    }

    await Task.findByIdAndDelete(taskId); // Using findByIdAndDelete for deletion
    await User.updateMany(
      { tasks: taskId },
      { $pull: { tasks: taskId } }
    );
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).json({ message: 'Error deleting task', error: err.message });
  }
});


// Toggle task completion
router.put('/toggle/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const group = await Group.findById(task.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(member => member.userId.toString() === req.user.id && member.role === 'admin');

    if (task.createdBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }

    // Toggle task status between 'completed' and 'pending'
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    task.updatedAt = Date.now();

    const updatedTask = await task.save();
    res.status(200).json({ message: 'Task status updated successfully', task: updatedTask });
  } catch (err) {
    console.error('Error updating task status:', err.message);
    res.status(500).json({ message: 'Error updating task status', error: err.message });
  }
});

router.post('/comment/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ message: 'Comment is required' });
  }

  try {
    const task = await Task.findById(taskId).populate('comments.userId', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const newComment = {
      userId: req.user.id, // Ensure this is the authenticated user
      comment,
      createdAt: Date.now(),
    };

    task.comments.push(newComment);
    await task.save();

    // Populate user data before returning the comment
    const populatedComment = await Task.findById(taskId)
      .populate('comments.userId', 'name'); // Only populate the user's name
    const commentWithUser = populatedComment.comments.pop(); // Get the last added comment

    res.status(201).json({ comment: commentWithUser }); // Send the populated comment back
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
});


// Assuming the Task model has a comments array, each comment contains a userId field
router.delete('/comment/:taskId/:commentId', authenticateUser, async (req, res) => {
  const { taskId, commentId } = req.params;
  
  try {
    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find the comment by ID within the task's comments
    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Ensure that the user deleting the comment is the one who created it
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Remove the comment from the task
    task.comments.pull(commentId);
    await task.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
});

router.put('/assign/:taskId', authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { userId } = req.body;

  // Validate taskId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    // Ensure the user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Assign the user to the task
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { assignedTo: userId } }, // Prevent duplicate assignments
      { new: true }
    ).populate('assignedTo', 'name email');

    // Check if the task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Respond with success
    res.status(200).json({ message: 'Task assigned successfully', task });
  } catch (err) {
    console.error('Error assigning user to task:', err.message);
    res.status(500).json({ message: 'Error assigning user to task', error: err.message });
  }
});


module.exports = router;
