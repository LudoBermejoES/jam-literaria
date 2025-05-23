import { sessionHandlers } from './sessionHandlers.js';
import { ideaHandlers } from './ideaHandlers.js';
import { voteHandlers } from './voteHandlers.js';
import * as userService from '../services/userService.js';
import { initSocketIO } from './io.js';

/**
 * Set up the Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export function setupSocketServer(httpServer) {
    const io = initSocketIO(httpServer, {
        cors: {
            origin: function(origin, callback) {
                const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:5173'];
                // Allow requests with no origin
                if(!origin) return callback(null, true);
                if(allowedOrigins.indexOf(origin) !== -1){
                    return callback(null, true);
                }
                return callback(null, true); // temporarily allow all origins
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
  
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    
    // Validate user exists
    try {
      const user = userService.getUserById(userId);
      
      if (!user) {
        return next(new Error('Invalid user'));
      }
      
      // Attach user to socket
      socket.userId = userId;
      socket.user = user;
      
      return next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Register event handlers
    sessionHandlers(io, socket);
    ideaHandlers(io, socket);
    voteHandlers(io, socket);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
  
  return io;
} 