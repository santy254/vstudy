const express = require('express');
const mongoose = require('mongoose');
const YouTubeVideo = require('../models/YouTube');

const router = express.Router();

/**
 * @route   POST /videos
 * @desc    Add a new video
 * @access  Public
 */
router.post('/videos', async (req, res) => {
  const { groupId, sharedBy, videoTitle, videoUrl, description, thumbnail } = req.body;

  if (!groupId || !sharedBy || !videoTitle || !videoUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newVideo = new YouTubeVideo({
      groupId,
      sharedBy,
      videoTitle,
      videoUrl,
      description,
      thumbnail,
    });

    const savedVideo = await newVideo.save();
    res.status(201).json(savedVideo);
  } catch (error) {
    res.status(500).json({ error: 'Error adding video', details: error.message });
  }
});

/**
 * @route   GET /videos/:groupId
 * @desc    Get all videos for a specific group
 * @access  Public
 */
router.get('/videos/:groupId', async (req, res) => {
  const { groupId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ error: 'Invalid group ID' });
  }

  try {
    const videos = await YouTubeVideo.find({ groupId }).sort({ sharedAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching videos', details: error.message });
  }
});

/**
 * @route   PUT /videos/:id
 * @desc    Update a specific video
 * @access  Public
 */
router.put('/videos/:id', async (req, res) => {
  const { id } = req.params;
  const { videoTitle, videoUrl, description, thumbnail } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid video ID' });
  }

  try {
    const updatedVideo = await YouTubeVideo.findByIdAndUpdate(
      id,
      { videoTitle, videoUrl, description, thumbnail },
      { new: true, runValidators: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(updatedVideo);
  } catch (error) {
    res.status(500).json({ error: 'Error updating video', details: error.message });
  }
});

/**
 * @route   DELETE /videos/:id
 * @desc    Delete a specific video
 * @access  Public
 */
router.delete('/videos/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid video ID' });
  }

  try {
    const deletedVideo = await YouTubeVideo.findByIdAndDelete(id);

    if (!deletedVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video successfully deleted', deletedVideo });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting video', details: error.message });
  }
});

module.exports = router;
