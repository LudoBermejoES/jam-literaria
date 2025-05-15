import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../../index';

const router = express.Router();
const prisma = new PrismaClient();

// Define handler type that allows returning responses
type RouteHandler = (req: Request, res: Response) => Promise<any>;

// Helper function to generate a random session code
export const generateSessionCode = async (): Promise<string> => {
  // Generate a random 6-character code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Check if code already exists
  const existingSession = await prisma.session.findUnique({
    where: { code }
  });
  
  // If code exists, generate a new one recursively
  if (existingSession) {
    return generateSessionCode();
  }
  
  return code;
};

// Create a new session
export const createSession: RouteHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Generate a unique session code
    const sessionCode = await generateSessionCode();
    
    // Create the session
    const session = await prisma.session.create({
      data: {
        code: sessionCode,
        ownerId: userId,
        participants: {
          connect: { id: userId }
        }
      },
      include: {
        participants: true
      }
    });
    
    return res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
};

// Join a session with code
export const joinSession: RouteHandler = async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and session code are required' });
    }
    
    // Find session by code
    const session = await prisma.session.findUnique({
      where: { code },
      include: { participants: true }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if user is already a participant
    const isParticipant = session.participants.some(p => p.id === userId);
    
    if (!isParticipant) {
      // Add user to participants
      const updatedSession = await prisma.session.update({
        where: { id: session.id },
        data: {
          participants: {
            connect: { id: userId }
          }
        },
        include: { participants: true }
      });
      
      // Notify other participants via Socket.io
      io.to(`session-${session.id}`).emit('user-joined', { 
        userId,
        sessionId: session.id 
      });
      
      return res.status(200).json(updatedSession);
    } else {
      // User is already a participant
      return res.status(200).json(session);
    }
  } catch (error) {
    console.error('Error joining session:', error);
    return res.status(500).json({ error: 'Failed to join session' });
  }
};

// Get session status
export const getSessionStatus: RouteHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        ideas: true,
        owner: true
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    return res.status(200).json(session);
  } catch (error) {
    console.error('Error getting session status:', error);
    return res.status(500).json({ error: 'Failed to get session status' });
  }
};

// Start session (move from WAITING to COLLECTING_IDEAS)
export const startSession: RouteHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { participants: true }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Only owner can start the session
    if (req.body.userId !== session.ownerId) {
      return res.status(403).json({ error: 'Only session owner can start the session' });
    }
    
    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'COLLECTING_IDEAS'
      },
      include: { participants: true }
    });
    
    // Notify participants via Socket.io
    io.to(`session-${sessionId}`).emit('session-started', {
      sessionId,
      status: 'COLLECTING_IDEAS'
    });
    
    return res.status(200).json(updatedSession);
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({ error: 'Failed to start session' });
  }
};

// Start voting (move from COLLECTING_IDEAS to VOTING)
export const startVoting: RouteHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        ideas: true
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Only owner can start voting
    if (req.body.userId !== session.ownerId) {
      return res.status(403).json({ error: 'Only session owner can start voting' });
    }
    
    // Check if there are ideas to vote
    if (session.ideas.length === 0) {
      return res.status(400).json({ error: 'No ideas submitted for voting' });
    }
    
    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'VOTING',
        currentRound: 1
      },
      include: {
        participants: true,
        ideas: true
      }
    });
    
    // Notify participants via Socket.io
    io.to(`session-${sessionId}`).emit('voting-started', {
      sessionId,
      status: 'VOTING',
      round: 1,
      ideas: updatedSession.ideas
    });
    
    return res.status(200).json(updatedSession);
  } catch (error) {
    console.error('Error starting voting:', error);
    return res.status(500).json({ error: 'Failed to start voting' });
  }
};

// Process results and handle next steps (finalizing or starting new round)
export const getSessionResults: RouteHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        ideas: true,
        votes: {
          where: {
            round: prisma.session.findUnique({ 
              where: { id: sessionId },
              select: { currentRound: true }
            }).currentRound
          }
        }
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // TODO: Implement the vote counting and idea selection logic
    // For now, return a simplified response
    
    return res.status(200).json({
      status: session.status,
      ideas: session.ideas,
      // Additional fields would be populated based on voting results
    });
  } catch (error) {
    console.error('Error processing results:', error);
    return res.status(500).json({ error: 'Failed to process results' });
  }
};

// Register routes
router.post('/create', createSession);
router.post('/join', joinSession);
router.get('/:sessionId/status', getSessionStatus);
router.post('/:sessionId/start', startSession);
router.post('/:sessionId/voting', startVoting);
router.get('/:sessionId/results', getSessionResults);

export default router; 