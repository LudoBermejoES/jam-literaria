const express = require('express');
const router = express.Router();
const { 
  createSession, 
  getSession, 
  getSessionByCode, 
  getParticipants, 
  addParticipant,
  updateSessionStatus,
  isSessionOwner,
  getSessionsByParticipant,
  deleteSession,
  getSessionUpdates
} = require('../models/Session');
const { requireAuth } = require('../middleware/auth');
const { updateUserActivity } = require('../models/User');

// Middleware to add session data to all session routes
router.use(requireAuth);

// Session dashboard - list user's sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await getSessionsByParticipant(req.user.id);
    
    res.render('sessions/index', { 
      title: 'Mis Sesiones',
      user: req.user,
      sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error al cargar las sesiones',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Form to create a new session
router.get('/new', (req, res) => {
  res.render('sessions/new', { 
    title: 'Crear Nueva Sesión',
    user: req.user,
    error: null
  });
});

// Process new session creation
router.post('/new', async (req, res) => {
  try {
    const session = await createSession(req.user.id);
    
    res.redirect(`/session/${session.id}`);
  } catch (error) {
    console.error('Error creating session:', error);
    res.render('sessions/new', { 
      title: 'Crear Nueva Sesión',
      user: req.user,
      error: 'No se pudo crear la sesión. Por favor intenta de nuevo.'
    });
  }
});

// Form to join an existing session
router.get('/join', (req, res) => {
  res.render('sessions/join', { 
    title: 'Unirse a Sesión',
    user: req.user,
    error: null
  });
});

// Direct join via link
router.get('/join/:code', async (req, res) => {
  const { code } = req.params;
  
  // If user is not logged in, store code in session and redirect to login
  if (!req.user) {
    req.session.pendingSessionCode = code;
    return res.redirect('/auth');
  }
  
  try {
    const session = await getSessionByCode(code);
    
    if (!session) {
      return res.render('sessions/join', { 
        title: 'Unirse a Sesión',
        user: req.user,
        error: 'Código de sesión no válido',
        code
      });
    }
    
    // If session is already in COLLECTING_IDEAS or further, don't allow joining
    if (session.status !== 'WAITING') {
      return res.render('sessions/join', { 
        title: 'Unirse a Sesión',
        user: req.user,
        error: 'La sesión ya ha comenzado y no acepta nuevos participantes',
        code
      });
    }
    
    // Add user to session
    await addParticipant(session.id, req.user.id);
    
    // Update user's last active timestamp
    await updateUserActivity(req.user.id);
    
    res.redirect(`/session/${session.id}`);
  } catch (error) {
    console.error('Error joining session via link:', error);
    res.render('sessions/join', { 
      title: 'Unirse a Sesión',
      user: req.user,
      error: 'Error al unirse a la sesión. Por favor intenta de nuevo.',
      code
    });
  }
});

// Process join session form
router.post('/join', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || code.trim() === '') {
      return res.render('sessions/join', { 
        title: 'Unirse a Sesión',
        user: req.user,
        error: 'El código de sesión es requerido'
      });
    }
    
    const session = await getSessionByCode(code);
    
    if (!session) {
      return res.render('sessions/join', { 
        title: 'Unirse a Sesión',
        user: req.user,
        error: 'Código de sesión no válido'
      });
    }
    
    // If session is already in COLLECTING_IDEAS or further, don't allow joining
    if (session.status !== 'WAITING') {
      return res.render('sessions/join', { 
        title: 'Unirse a Sesión',
        user: req.user,
        error: 'La sesión ya ha comenzado y no acepta nuevos participantes'
      });
    }
    
    // Add user to session
    await addParticipant(session.id, req.user.id);
    
    // Update user's last active timestamp
    await updateUserActivity(req.user.id);
    
    res.redirect(`/session/${session.id}`);
  } catch (error) {
    console.error('Error joining session:', error);
    res.render('sessions/join', { 
      title: 'Unirse a Sesión',
      user: req.user,
      error: 'Error al unirse a la sesión. Por favor intenta de nuevo.'
    });
  }
});

// Polling endpoint for session updates
router.get('/:id/updates', async (req, res) => {
  try {
    const { id } = req.params;
    const { since } = req.query;
    
    if (!since) {
      return res.status(400).json({ error: 'Missing since parameter' });
    }
    
    // Verify user is a participant in the session
    const participants = await getParticipants(id);
    const isParticipant = participants.some(p => p.id === req.user.id);
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'No estás autorizado para ver esta sesión' });
    }
    
    // Get session updates since the specified time
    const updates = await getSessionUpdates(id, since);
    
    // Update user's last active timestamp
    await updateUserActivity(req.user.id);
    
    res.json(updates);
  } catch (error) {
    console.error('Error fetching session updates:', error);
    res.status(500).json({ error: 'Error al obtener actualizaciones de la sesión' });
  }
});

// View a specific session
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await getSession(id);
    
    if (!session) {
      return res.status(404).render('error', { 
        title: 'Sesión no encontrada',
        message: 'La sesión que estás buscando no existe' 
      });
    }
    
    const participants = await getParticipants(id);
    const isOwner = session.owner_id === req.user.id;
    
    // If user is not a participant, redirect to join page with code
    const isParticipant = participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.redirect(`/session/join?code=${session.code}`);
    }
    
    // Update user's last active timestamp
    await updateUserActivity(req.user.id);
    
    res.render('sessions/detail', { 
      title: `Sesión: ${session.code}`,
      user: req.user,
      session,
      participants,
      isOwner,
      scripts: ['/js/session.js']
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error al cargar la sesión',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Start the session (owner only)
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is session owner
    const isOwner = await isSessionOwner(id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ 
        error: 'Solo el creador de la sesión puede iniciarla' 
      });
    }
    
    // Check if there are enough participants (at least 2)
    const participants = await getParticipants(id);
    if (participants.length < 2) {
      return res.status(400).json({ 
        error: 'Se necesitan al menos 2 participantes para iniciar la sesión' 
      });
    }
    
    // Update session status
    const session = await updateSessionStatus(id, 'COLLECTING_IDEAS');
    
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Error al iniciar la sesión' });
  }
});

// Delete a session (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is session owner
    const isOwner = await isSessionOwner(id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ 
        error: 'Solo el creador de la sesión puede eliminarla' 
      });
    }
    
    // Delete the session
    const success = await deleteSession(id);
    
    if (!success) {
      return res.status(500).json({ error: 'Error al eliminar la sesión' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Error al eliminar la sesión' });
  }
});

// Alternative for DELETE route since some Express setups have issues with DELETE
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is session owner
    const isOwner = await isSessionOwner(id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ 
        error: 'Solo el creador de la sesión puede eliminarla' 
      });
    }
    
    // Delete the session
    const success = await deleteSession(id);
    
    if (!success) {
      return res.status(500).json({ error: 'Error al eliminar la sesión' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session in POST route:', error);
    res.status(500).json({ error: 'Error al eliminar la sesión' });
  }
});

module.exports = router; 