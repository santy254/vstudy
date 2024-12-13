const mongoose = require('mongoose');

const YouTubeVideoSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true, // Add an index for faster querying by group
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index sharedBy for optimized searches
  },
  videoTitle: {
    type: String,
    required: true,
    maxlength: 150,
  },
  videoUrl: {
    type: String,
    required: true,
    match: [/^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/, "Invalid YouTube URL"], // Validate YouTube URL
  },
  description: {
    type: String,
    maxlength: 500,
  },
  thumbnail: {
    type: String,
    match: [/^(https?|data):/, "Invalid URL format for thumbnail"], // Validate URL or data URI format
  },
  sharedAt: {
    type: Date,
    default: Date.now,
  },
});


const YouTubeVideo = mongoose.model('YouTubeVideo', YouTubeVideoSchema );

module.exports = YouTubeVideo;
