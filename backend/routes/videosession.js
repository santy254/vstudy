const express = require('express');
const VideoSession = require('../models/VideoSession');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateUser } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/start', authenticateUser, async (req, res) => {
  const { groupId } = req.body; // Group ID from the request body

  try {
    // Check if there's an already active session for this group
    const existingSession = await VideoSession.findOne({
      groupId,
      status: { $ne: 'ended' }, // Ensure the status is not "ended"
    });

    if (existingSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'An active session already exists for this group.', 
        sessionId: existingSession._id 
      });
    }

    // Create the video session
    const videoSession = new VideoSession({
      groupId,
      hostUserId: req.user._id, // Current user is the host
      participants: [{ userId: req.user._id }], // Add the host as the first participant
    });

    // Save the video session to the database
    await videoSession.save();

    await Group.findByIdAndUpdate(groupId, {
      $push: { videoSessions: videoSession._id }, // Push the session ID to the `videoSessions` array
    });


    res.status(200).json({ success: true, sessionId: videoSession._id });
  } catch (error) {
    console.error('Error starting video session:', error);
    res.status(500).json({ success: false, message: 'Failed to start session' });
  }
});
router.post('/end', authenticateUser, async (req, res) => {
  const { sessionId } = req.body;

  try {
    // Find the video session by session ID
    const session = await VideoSession.findById(sessionId);

    // If session is not found, return 404
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Ensure only the host can end the session
    if (!session.hostUserId.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only the host can end this session" });
    }

    // Mark session as ended or delete it (depending on your logic)
    session.status = 'ended'; // Add a `status` field in the VideoSession model to mark its state
    await session.save();

    // Remove the session ID from users' groups array
    for (const participant of session.participants) {
      await User.findByIdAndUpdate(participant.userId, {
        $pull: { groups: sessionId }, // Remove session from the user's groups array
      });
    }

    res.status(200).json({ success: true, message: "Session ended successfully" });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end video session",
      error: error.message,
    });
  }
});
router.get('/group/:groupId', authenticateUser, async (req, res) => {
  const { groupId } = req.params;
  const { period } = req.query;

  try {
    let dateFilter = {};
    if (period) {
      const days = parseInt(period.replace('d', ''), 10);
      if (!isNaN(days)) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = { startTime: { $gte: startDate } };
      }
    }

    const videoSessions = await VideoSession.find({
      groupId: groupId,
      ...dateFilter,
    })
    .populate('hostUserId', 'name')  // Populate the host's name
    .sort({ startTime: -1 });

    if (!videoSessions) {
      return res.status(404).json({ message: 'No video sessions found for this group.' });
    }
    const sessionReports = videoSessions.map((session) => {
      // Calculate session duration (if session has ended)
      const duration = session.endTime
        ? (new Date(session.endTime) - new Date(session.startTime)) / 1000 // In seconds
        : 'Ongoing';

      // Map participant details
      const participants = session.participants.map((participant) => ({
        name: participant.userId.name,
        email: participant.userId.email,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt || 'Still in session',
      }));

      // Map chat message summary
      const chatSummary = session.chatMessages.map((message) => ({
        sender: message.userId.name,
        message: message.message,
        timestamp: message.createdAt,
      }));

      // Structure the session report
      return {
        sessionId: session._id,
        host: {
          name: session.hostUserId.name,
          email: session.hostUserId.email,
        },
        participants,
        chatSummary,
        startTime: session.startTime,
        endTime: session.endTime || 'Ongoing',
        duration: typeof duration === 'string' ? duration : `${Math.floor(duration / 60)} minutes`,
        messageCount: session.chatMessages.length,
      };
    });

    // Send response
    res.status(200).json({
      success: true,
      report: sessionReports,
    });
  } catch (error) {
    console.error('Error generating session report:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating the report.',
    });
  }
});

router.get("/participants/:sessionId", authenticateUser, async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "Session ID is required.",
    });
  }

  try {
    // Fetch the session and populate participants' user details
    const session = await VideoSession.findById(sessionId).populate({
      path: "participants.userId", // Populate userId in the embedded participants array
      select: "name", // Only fetch necessary fields
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    if (session.participants.length === 0) {
      return res.status(200).json({
        success: true,
        participants: [],
        message: "No participants yet.",
      });
    }

    // Transform participants to include user details
    const participants = session.participants.map((participant) => ({
      name: participant.userId.name,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt || null, // Include leftAt if available
    }));

    res.status(200).json({
      success: true,
      participants,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

router.post('/join-session', authenticateUser, async (req, res) => {
  const { sessionId } = req.body; // Session ID from the request body

  try {
    // Find the session
    const session = await VideoSession.findById(sessionId);
    if (!session || session.status === 'ended') {
      return res.status(404).json({ success: false, message: 'No active session found.' });
    }

    // Check if the user is already a participant
    if (session.participants.some((participant) => participant.userId.equals(req.user._id))) {
      return res.status(200).json({ success: true, message: 'You are already a participant.' });
    }

    // Add the user to the session's participants list
    session.participants.push({ userId: req.user._id });
    await session.save();

    res.status(200).json({ success: true, message: 'Joined session successfully', sessionId });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ success: false, message: 'Failed to join session' });
  }
});


router.get('/get-session', authenticateUser, async (req, res) => {
  const { groupId } = req.query;

  try {
    // Fetch an active session for the group
    const session = await VideoSession.findOne({
      groupId,
      status: { $ne: 'ended' }, // Ensure the session is not marked as 'ended'
    }).populate('participants.userId', 'name'); // Populate participant details

    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session found for this group.' });
    }

    res.status(200).json({
      success: true,
      sessionId: session._id,
      participants: session.participants,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
});


router.post('/send-message', authenticateUser, async (req, res) => {
  const { sessionId, message } = req.body;
  const userId = req.user._id;

  if (!sessionId || !message) {
    return res.status(400).json({ success: false, message: 'Session ID and message are required' });
  }

  try {
    const session = await VideoSession.findById(sessionId);
    if (!session) {
      console.log("Session not found:", sessionId);
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'active') {
      console.log("Session is inactive:", session);
      return res.status(403).json({ success: false, message: 'Session is inactive' });
    }

    session.chatMessages.push({ userId, message });
    await session.save();

    const io = req.app.get('io');
    io.to(sessionId).emit('receiveMessage', { userId, message });

    res.status(200).json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Route to fetch messages for a session
// Route to fetch messages for a specific session
router.get('/messages/:sessionId', authenticateUser, async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Find the session by ID and populate the userId for each chat message with the user's name
    const session = await VideoSession.findById(sessionId)
      .populate('chatMessages.userId', 'name'); // Only populate 'name' field for userId

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Send the chat messages as the response
    res.status(200).json({ success: true, chatMessages: session.chatMessages });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
