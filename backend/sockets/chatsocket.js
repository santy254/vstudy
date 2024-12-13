
module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log(`Chat socket connected: ${socket.id}`);
  
      // Join a group room
      socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
        console.log(`User ${socket.id} joined group: ${groupId}`);
      });
  
      // Handle message sending
      socket.on('sendMessage', (messageData) => {
        const { chatId, ...message } = messageData;
        io.to(chatId).emit('receiveMessage', message);
        console.log(`Message sent to room ${chatId}:`, message);
      });
  
      // Handle emoji reactions
      socket.on('addEmojiReaction', (reactionData) => {
        const { groupId, ...reaction } = reactionData;
        io.to(groupId).emit('emojiReactionAdded', reaction);
        console.log(`Emoji reaction added:`, reaction);
      });
  
      socket.on('removeEmojiReaction', (reactionData) => {
        const { groupId, ...reaction } = reactionData;
        io.to(groupId).emit('emojiReactionRemoved', reaction);
        console.log(`Emoji reaction removed:`, reaction);
      });
  
      // Leave group room on disconnect
      socket.on('disconnect', () => {
        console.log(`Chat socket disconnected: ${socket.id}`);
      });
    });
  };
  