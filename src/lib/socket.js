const socketIO = require('socket.io');

/**
 * Sets up Socket.io with an Express server
 * @param {Object} server - HTTP server instance
 * @returns {Object} - Socket.io instance
 */
function setupSocket(server) {
  const io = socketIO(server);
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Handle joining a session room
    socket.on('join-session', async (sessionId, userId) => {
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      
      // Notify others in the room that a user has joined
      socket.to(roomName).emit('user-joined', userId);
      
      console.log(`User ${userId} joined session ${sessionId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  
  return io;
}

module.exports = { setupSocket }; 