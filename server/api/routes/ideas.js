import express from 'express';
import {
  createIdea,
  getIdeasBySession,
  getUserIdeasForSession,
  getCandidateIdeas,
  getWinningIdeas
} from '../controllers/ideaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Session-specific idea routes
router.post('/:id/ideas', createIdea);
router.get('/:id/ideas', getIdeasBySession);
router.get('/:id/ideas/mine', getUserIdeasForSession);
router.get('/:id/ideas/candidates', getCandidateIdeas);
router.get('/:id/ideas/winners', getWinningIdeas);

export default router; 