import express from 'express';
import {
  createSession,
  getSession,
  joinSession,
  startSession,
  getSessionStatus,
  getAllSessions,
  getJoinedSessions,
  deleteSession
} from '../controllers/sessionController.js';
import { authMiddleware, sessionOwnerMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Session routes
router.post('/', createSession);
router.get('/', getAllSessions);
router.get('/joined', getJoinedSessions);
router.get('/:id', getSession);
router.get('/:id/status', getSessionStatus);
router.post('/:id/join', joinSession);
router.post('/:id/start', startSession); // Ideally should use sessionOwnerMiddleware
router.delete('/:id', deleteSession);

export default router; 