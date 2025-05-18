const express = require('express');
const router = express.Router();
const ideaModel = require('../models/Idea');
const sessionModel = require('../models/Session');
const auth = require('../middleware/auth');

// Middleware to ensure user is a participant in the session
async function ensureParticipant(req, res, next) {
  const { sessionId } = req.params;
  const userId = req.user.id;
  
  try {
    const participants = await sessionModel.getParticipants(sessionId);
    const isParticipant = participants.some(p => p.id === userId);
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'No eres participante en esta sesión' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking participant:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Get all ideas for a session
router.get('/:sessionId', auth.requireAuth, ensureParticipant, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionModel.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Only return ideas if the session is in collecting, voting, or finished status
    if (!['COLLECTING_IDEAS', 'VOTING', 'REVOTING', 'FINISHED'].includes(session.status)) {
      return res.status(403).json({ error: 'Las ideas no están disponibles en este momento' });
    }
    
    const ideas = await ideaModel.getIdeasBySession(sessionId);
    res.json({ ideas });
  } catch (error) {
    console.error('Error getting ideas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get ideas by the current user for a session
router.get('/:sessionId/mine', auth.requireAuth, ensureParticipant, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const ideas = await ideaModel.getIdeasByAuthor(sessionId, userId);
    res.json({ ideas });
  } catch (error) {
    console.error('Error getting user ideas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Submit a new idea
router.post('/:sessionId', auth.requireAuth, ensureParticipant, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'El contenido de la idea no puede estar vacío' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ error: 'La idea no puede exceder los 500 caracteres' });
    }
    
    // Check if session is in the idea collection phase
    const session = await sessionModel.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    if (session.status !== 'COLLECTING_IDEAS') {
      return res.status(403).json({ error: 'La sesión no está en fase de recolección de ideas' });
    }
    
    // Check if user has already submitted max ideas
    const userIdeasCount = await ideaModel.countIdeasByAuthor(sessionId, userId);
    const participants = await sessionModel.getParticipants(sessionId);
    const maxIdeasPerPerson = Math.max(2, Math.floor(10 / participants.length));
    
    if (userIdeasCount >= maxIdeasPerPerson) {
      return res.status(403).json({ 
        error: `Has alcanzado el límite de ${maxIdeasPerPerson} ideas para esta sesión`
      });
    }
    
    const idea = await ideaModel.createIdea(content, userId, sessionId);
    res.status(201).json({ idea });
  } catch (error) {
    console.error('Error creating idea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete an idea (only author can delete)
router.delete('/:sessionId/idea/:ideaId', auth.requireAuth, ensureParticipant, async (req, res) => {
  try {
    const { sessionId, ideaId } = req.params;
    const userId = req.user.id;
    
    // Check if session is in the idea collection phase
    const session = await sessionModel.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    if (session.status !== 'COLLECTING_IDEAS') {
      return res.status(403).json({ error: 'Las ideas solo pueden eliminarse durante la fase de recolección' });
    }
    
    const success = await ideaModel.deleteIdea(ideaId, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Idea no encontrada o no eres el autor' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting idea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 