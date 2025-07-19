const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Used for generating reset tokens

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'teacher'],
    default: 'student',
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    }
  ],
  bio: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },

  // App Preferences
  application: {
    type: new mongoose.Schema({
      theme: { type: String, default: 'light' },
      language: { type: String, default: 'en' }
    }, { _id: false }),
    default: () => ({})
  },

  // Privacy Settings
  privacy: {
    type: new mongoose.Schema({
      visibility: { type: String, enum: ['public', 'private', 'onlyFriends'], default: 'public' },
      activityStatus: { type: String, enum: ['showWhenActive', 'hideMyActivity'], default: 'showWhenActive' },
      dataSharing: { type: Boolean, default: false },
      analyticsTracking: { type: Boolean, default: true },
      locationSharing: { type: Boolean, default: false },
      contactSync: { type: Boolean, default: false }
    }, { _id: false }),
    default: () => ({})
  },

  // Notification Settings
  notifications: {
    type: new mongoose.Schema({
      emailNotifications: { type: String, enum: ['allNotifications', 'onlyMentions', 'onlyImportant', 'none'], default: 'allNotifications' },
      inAppNotifications: { type: String, enum: ['allNotifications', 'onlyDirectMessages', 'onlyImportant', 'none'], default: 'allNotifications' },
      pushNotifications: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
      groupUpdates: { type: Boolean, default: true },
      courseAnnouncements: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      soundEnabled: { type: Boolean, default: true }
    }, { _id: false }),
    default: () => ({})
  },

  // Security Settings
  security: {
    type: new mongoose.Schema({
      twoFactorAuth: { type: Boolean, default: false },
      loginAlerts: { type: Boolean, default: true },
      sessionTimeout: { type: String, default: '30' },
      deviceTrust: { type: Boolean, default: true }
    }, { _id: false }),
    default: () => ({})
  },

  // 🎯 Embedded Tasks
  tasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date }
  }],

  // 🗓️ Embedded Events
  events: [{
    title: { type: String, required: true },
    date: { type: Date, required: true },
    reminderEnabled: { type: Boolean, default: false },
    notes: { type: String, default: '' }
  }],

  // 📚 Embedded Courses
  courses: [{
    title: { type: String, required: true },
    instructor: { type: String },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    progress: { type: Number, default: 0 }
  }],

  // 🔊 Notification Settings
  notificationSettings: {
    voiceReminders: { type: Boolean, default: true },
    sound: { type: String, default: 'default' }
  },

  // 🧩 Dashboard Layout Settings
  dashboardSettings: {
    showWelcomePanel: { type: Boolean, default: true },
    compactMode: { type: Boolean, default: false }
  },

  // 🔐 Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔒 Password Hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🔐 Password Verification
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 🔑 Generate Reset Token
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
