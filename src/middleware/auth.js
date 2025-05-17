const { getUserById, updateUserActivity } = require('../models/User');

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function requireAuth(req, res, next) {
  // Check if user is in session
  if (!req.session.userId) {
    return res.redirect('/auth');
  }
  
  try {
    // Get user from database
    const user = await getUserById(req.session.userId);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy();
      return res.redirect('/auth');
    }
    
    // Update user's last active timestamp
    await updateUserActivity(user.id);
    
    // Add user to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).render('error', { 
      message: 'Error de autenticación',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
}

/**
 * Middleware to check if user is not authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireNoAuth(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/session');
  }
  next();
}

/**
 * Optional auth middleware - doesn't redirect if not authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function optionalAuth(req, res, next) {
  if (req.session.userId) {
    try {
      const user = await getUserById(req.session.userId);
      
      if (user) {
        await updateUserActivity(user.id);
        req.user = user;
      } else {
        // Clear invalid session
        req.session.destroy();
      }
    } catch (error) {
      console.error('Optional auth middleware error:', error);
    }
  }
  
  next();
}

module.exports = {
  requireAuth,
  requireNoAuth,
  optionalAuth
}; 