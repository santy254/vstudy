const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const User = require('../models/User');
const Group = require('../models/Group');
const router = express.Router();
require('dotenv').config();
const { authenticateUser } = require('../middleware/authMiddleware'); // Import middleware

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Rename the file
  },
});
const upload = multer({ storage: storage });
// Nodemailer configuration for sending emails
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// @route POST /api/auth/register
// @desc Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

   const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });


    // Optionally, return the newly created user object without the password
    const userResponse = { id: newUser._id, name: newUser.name, email: newUser.email };

    res.status(201).json({ message: 'User registered successfully!', user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/auth/login
// @desc Authenticate user and return JWT token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });


    const userResponse = { id: user._id, name: user.name, email: user.email };

    res.json({ message: 'Login successful', user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/auth/forgot-password
// @desc Send a password reset link to the user's email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000; // Token valid for 1 hour

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `<h1>Password Reset Request</h1>
                     <p>Click the following link to reset your password:</p>
                     <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: message,
    });

    res.status(200).json({ message: 'Email sent. Please check your inbox.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

// @route PUT /api/auth/reset-password/:token
// @desc Reset the user's password using the reset token
router.put('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  const resetToken = req.params.token;

  try {
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

// @route GET /api/auth/profile
// @desc Get the authenticated user's profile
// @access Private (Protected route)
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    // Verify if req.user exists and has an _id field
    console.log('Authenticated user ID:', req.user._id);  // For debugging

    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error retrieving profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Use the upload middleware for profile update
router.put('/profile', authenticateUser, upload.single('avatar'), async (req, res) => {
  // Handle profile update logic here
  try {
    const { name, email, location, bio } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update user profile
    user.name = name || user.name;
    user.email = email || user.email;
    user.location = location || user.location;
    user.bio = bio || user.bio;

    if (req.file) {
      user.avatar = req.file.path;  // Store avatar path
    }

    await user.save();
    res.status(200).json(user);  // Send the updated user back
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/group-users/:groupId', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Validate groupId format using regex for MongoDB ObjectId
    if (!groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid group ID format.' });
    }

    // Find the group and populate 'members.userId' to fetch user details (name, email)
    const group = await Group.findById(groupId).populate('members.userId', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Extract only user details from populated members
    const users = group.members
      .filter(member => member.userId) // Only include members with a valid userId
      .map(member => ({
        userId: member.userId._id,  // User's ObjectId
        name: member.userId.name,    // User's name
        email: member.userId.email  // User's email
      }));

    // Respond with the list of users
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching group users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
