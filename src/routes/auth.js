const express = require('express');
const router = express.Router();
const { createUser, getUserById, getUserByName } = require('../models/User');
const { requireAuth, requireNoAuth } = require('../middleware/auth');

// Display login form
router.get('/', requireNoAuth, (req, res) => {
  res.render('auth/login', { title: 'Ingresa tu nombre', error: null });
});

// Process login form
router.post('/', requireNoAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.render('auth/login', { 
        title: 'Ingresa tu nombre', 
        error: 'El nombre es requerido' 
      });
    }
    
    // Check if user already exists
    let user = await getUserByName(name);
    
    // Create user if they don't exist
    if (!user) {
      user = await createUser(name);
    }
    
    // Store user ID in session
    req.session.userId = user.id;
    
    // Check if there's a pending session code to redirect to
    if (req.session.pendingSessionCode) {
      const code = req.session.pendingSessionCode;
      delete req.session.pendingSessionCode;
      return res.redirect(`/session/join/${code}`);
    }
    
    res.redirect('/session');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { 
      title: 'Ingresa tu nombre', 
      error: 'Error al procesar la solicitud. Por favor intenta de nuevo.' 
    });
  }
});

// Get current user info
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

module.exports = router; 