import { Server } from 'socket.io';

// Global Socket.IO instance
let io;

/**
 * Initialize Socket.IO with an HTTP server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export function initSocketIO(httpServer, options = {}) {
  io = new Server(httpServer, options);
  return io;
}

/**
 * Get the Socket.IO instance
 * @returns {Object} Socket.IO server instance
 */
export { io }; 