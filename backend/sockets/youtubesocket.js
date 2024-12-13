const handleSocketConnections = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a room (e.g., group chat room)
    socket.on('joinRoom', ({ youtubeId, userName }) => {
      if (youtubeId && userName) {
        socket.join(youtubeId);
        console.log(`${userName} joined room: ${youtubeId}`);
        socket.to(youtubeId).emit('userJoined', { userName });
      } else {
        console.error('Backend: Missing youtubeId or userName in joinRoom event');
      }
    });

    // Handle sending a chat message to a specific room
    socket.on('sendMessage', ({ youtubeId, userName, message }) => {
      if (youtubeId && message) {
        io.to(youtubeId).emit('receiveMessage', { userName, message });
        console.log(`Message from ${userName} to room ${youtubeId}: ${message}`);
      } else {
        console.error('Backend: Missing youtubeId or message in sendMessage event');
      }
    });

    // Handle URL updates for video streaming in the room
    socket.on('updateUrl', ({ youtubeId, newUrl, newTitle }) => {
      if (youtubeId && newUrl) {
        io.to(youtubeId).emit('updateUrl', { newUrl, newTitle });
        console.log(`URL update in room ${youtubeId}: ${newUrl}`);
      } else {
        console.error('Backend: Missing youtubeId or newUrl in updateUrl event');
      }
    });

    // Handle video playback status update
    socket.on('playbackUpdate', ({ youtubeId, playingState }) => {
      if (youtubeId) {
        io.to(youtubeId).emit('playbackUpdate', { playingState });
        console.log(`Playback update in room ${youtubeId}: ${playingState}`);
      } else {
        console.error('Backend: Missing youtubeId in playbackUpdate event');
      }
    });

    // Handle video deletion event
    socket.on('deleteVideo', ({ youtubeId, videoId }) => {
      if (youtubeId && videoId) {
        io.to(youtubeId).emit('videoDeleted', { videoId });
        console.log(`Video deleted in room ${youtubeId}: ${videoId}`);
      } else {
        console.error('Backend: Missing youtubeId or videoId in deleteVideo event');
      }
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = handleSocketConnections;
