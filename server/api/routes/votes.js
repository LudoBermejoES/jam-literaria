import express from 'express';
import {
  submitVote,
  getVoteStatus,
  getVoteResults,
  checkUserVoted
} from '../controllers/voteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Session-specific vote routes
router.post('/:id/votes', submitVote);
router.get('/:id/votes/status', getVoteStatus);
router.get('/:id/votes/results', getVoteResults);
router.get('/:id/votes/user', checkUserVoted);

export default router; 