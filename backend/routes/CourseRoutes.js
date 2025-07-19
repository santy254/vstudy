const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authenticateUser } = require('../middleware/authMiddleware');

// POST /courses/register
router.post('/register', authenticateUser, async (req, res) => {
  try {
    const { title, instructor } = req.body;

    if (!title || !instructor) {
      return res.status(400).json({ message: 'Title and instructor are required' });
    }

    const newCourse = new Course({ 
      title, 
      instructor,
      createdBy: req.user._id // Associate course with the user
    });
    await newCourse.save();

    res.status(201).json({ message: 'Course registered', course: newCourse });
  } catch (err) {
    console.error('Error registering course:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /courses/user-courses - Get all courses for the authenticated user
router.get('/user-courses', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching courses for user:', req.user._id);
    
    const courses = await Course.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    
    console.log('Found courses:', courses.length);
    
    res.status(200).json({ courses });
  } catch (err) {
    console.error('Error fetching user courses:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /courses/:courseId - Delete a specific course
router.delete('/:courseId', authenticateUser, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('Deleting course:', courseId, 'for user:', req.user._id);
    
    const course = await Course.findOne({ _id: courseId, createdBy: req.user._id });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to delete it' });
    }
    
    await Course.findByIdAndDelete(courseId);
    
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
