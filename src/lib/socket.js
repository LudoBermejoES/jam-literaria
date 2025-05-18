const socketIO = require('socket.io');
const { updateUserActivity } = require('../models/User');
const { getUserById } = require('../models/User');

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
      if (!sessionId || !userId) {
        console.error('Missing sessionId or userId in join-session event');
        return;
      }
      
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      
      // Update user's last active timestamp
      try {
        await updateUserActivity(userId);
        
        // Get user information to send in notification
        const user = await getUserById(userId);
        if (user) {
          // Notify EVERYONE in the room (including the Maestro) that a user has joined
          io.to(roomName).emit('user-joined', {
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString()
          });
          
          console.log(`User ${user.name} (${userId}) joined session ${sessionId}`);
        }
      } catch (error) {
        console.error('Error updating user activity or getting user data:', error);
      }
    });
    
    // Handle session starting
    socket.on('start-session', (sessionId) => {
      if (!sessionId) {
        console.error('Missing sessionId in start-session event');
        return;
      }
      
      const roomName = `session-${sessionId}`;
      io.to(roomName).emit('session-started');
      
      console.log(`Session ${sessionId} started`);
    });
    
    // Handle idea submission
    socket.on('submit-idea', async (sessionId, userId) => {
      if (!sessionId || !userId) {
        console.error('Missing sessionId or userId in submit-idea event');
        return;
      }
      
      try {
        // Get user information to send in notification
        const user = await getUserById(userId);
        const roomName = `session-${sessionId}`;
        
        if (user) {
          socket.to(roomName).emit('idea-submitted', {
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString()
          });
          
          console.log(`User ${user.name} (${userId}) submitted an idea in session ${sessionId}`);
        }
      } catch (error) {
        console.error('Error getting user data for idea submission:', error);
      }
    });
    
    // Handle vote submission
    socket.on('submit-vote', async (sessionId, userId) => {
      if (!sessionId || !userId) {
        console.error('Missing sessionId or userId in submit-vote event');
        return;
      }
      
      try {
        // Get user information to send in notification
        const user = await getUserById(userId);
        const roomName = `session-${sessionId}`;
        
        if (user) {
          socket.to(roomName).emit('vote-submitted', {
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString()
          });
          
          console.log(`User ${user.name} (${userId}) submitted a vote in session ${sessionId}`);
        }
      } catch (error) {
        console.error('Error getting user data for vote submission:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  
  return io;
}

module.exports = { setupSocket };