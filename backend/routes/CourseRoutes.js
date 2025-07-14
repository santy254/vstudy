const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// POST /courses/register
router.post('/register', async (req, res) => {
  try {
    const { title, instructor } = req.body;

    if (!title || !instructor) {
      return res.status(400).json({ message: 'Title and instructor are required' });
    }

    const newCourse = new Course({ title, instructor });
    await newCourse.save();

    res.status(201).json({ message: 'Course registered', course: newCourse });
  } catch (err) {
    console.error('Error registering course:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
