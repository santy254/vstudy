const Peer = require('simple-peer');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Video chat socket connected: ${socket.id}`);

    // Handle user start call in a room
    socket.on('startCall', ({ roomId }) => {
      socket.join(roomId);
      console.log(`User ${socket.id} started a call in room: ${roomId}`);

      const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      socket.emit('allUsers', usersInRoom.filter((id) => id !== socket.id));
    });

    // Handle new user joining a session
    socket.on('sendingSignal', ({ userToSignal, callerID, signal }) => {
      io.to(userToSignal).emit('userJoined', { signal, callerID });
      console.log(`Signal sent from ${callerID} to ${userToSignal}`);
    });

    // Return signal from the joined user
    socket.on('returningSignal', ({ signal, callerID }) => {
      io.to(callerID).emit('receivingReturnedSignal', { signal, id: socket.id });
      console.log(`Signal returned to ${callerID} by ${socket.id}`);
    });

    // Handle end call event
    socket.on('endCall', ({ roomId }) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} ended call in room: ${roomId}`);
      io.to(roomId).emit('callEnded', { userId: socket.id });
    });

    // Update participants list when a user joins
    socket.on('updateParticipants', (roomId) => {
      const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      io.to(roomId).emit('updateUserList', usersInRoom);
    });

    // Handle messages within the session
    socket.on('sendMessage', ({ roomId, message }) => {
      io.to(roomId).emit('receiveMessage', { userId: socket.id, message });
      console.log(`Message in video session ${roomId}:`, message);
    });

    // Handle media stream from user
    socket.on('sendStream', ({ stream, roomId }) => {
      console.log(`User ${socket.id} sending media stream to room: ${roomId}`);

      // For each user in the room, we will set up the peer connection for the media stream
      const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      usersInRoom.forEach((userId) => {
        if (userId !== socket.id) {
          // Initiate peer connection to each other
          const peer = new Peer({
            initiator: true,
            trickle: false
          });

          // Send initial signal to the other user
          peer.signal(stream);

          socket.emit('userStream', { peer, userId });
        }
      });
    });

    // Handle media stream reception for peer-to-peer connection
    socket.on('receiveStream', ({ stream, userId }) => {
      console.log(`User ${socket.id} receiving media stream from ${userId}`);
      
      const peer = new Peer({
        initiator: false,
        trickle: false
      });

      // Signal back to peer
      peer.signal(stream);
      socket.emit('userStream', { peer, userId });
    });

    // Disconnect the user and clean up any necessary data
    socket.on('disconnect', () => {
      console.log(`Video chat socket disconnected: ${socket.id}`);
    });
  });
};
