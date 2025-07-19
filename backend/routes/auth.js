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

  console.log('🔍 Registration attempt:', { name, email, passwordLength: password?.length });

  try {
    console.log('👤 Checking if user exists...');
    const existingUser = await User.findOne({ email });
    console.log('👤 Existing user found:', !!existingUser);
    
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('✅ Creating new user...');
    const newUser = new User({ name, email, password });
    await newUser.save();
    console.log('✅ User saved successfully:', newUser._id);

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

  console.log('🔍 Login attempt:', { email, passwordLength: password?.length });

  try {
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', !!user);
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('🔐 Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔐 Password match:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', email);
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

// @route GET /api/auth/test (simple test route)
// @desc Test if auth routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!', timestamp: new Date() });
});

// @route GET /api/auth/debug-users (for debugging)
// @desc List all users in database (for debugging only)
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🔍 Debug users route called');
    const users = await User.find({}).select('name email createdAt');
    console.log('👥 Found users:', users.length);
    res.json({ 
      message: 'Users in database',
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// @route GET /api/auth/create-test-user (for debugging)
// @desc Create a test user for debugging
router.get('/create-test-user', async (req, res) => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@test.com' });
    if (existingUser) {
      return res.json({ message: 'Test user already exists', email: 'test@test.com', password: '123456' });
    }

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@test.com',
      password: '123456'
    });

    await testUser.save();
    console.log('✅ Test user created successfully');

    res.json({ 
      message: 'Test user created successfully',
      email: 'test@test.com',
      password: '123456',
      note: 'You can now login with these credentials'
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({ message: 'Error creating test user', error: error.message });
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
    const userId = req.user._id; // Fix: use _id instead of id

    console.log('Updating profile for user:', userId);
    console.log('Uploaded file:', req.file);
    console.log('Request body:', req.body);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log('User found:', user.email);
    console.log('Current profilePicture:', user.profilePicture);

    // Update user profile
    user.name = name || user.name;
    user.email = email || user.email;
    user.location = location || user.location;
    user.bio = bio || user.bio;

    if (req.file) {
      // Store relative path for the profile picture
      user.profilePicture = `/uploads/${req.file.filename}`;
      console.log('Profile picture path set to:', user.profilePicture);
      console.log('File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path
      });
    } else {
      console.log('No file uploaded - req.file is null/undefined');
    }

    await user.save();
    console.log('User profile updated successfully');
    console.log('Final user profilePicture field:', user.profilePicture);
    
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
