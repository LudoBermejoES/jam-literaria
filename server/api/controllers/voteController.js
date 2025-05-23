import * as voteService from '../../services/voteService.js';

/**
 * Submit a vote
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const submitVote = async (req, res) => {
  try {
    const { ideaId } = req.body;
    const { user } = req;
    const sessionId = req.params.id || req.body.sessionId;
    
    if (!ideaId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Idea ID and session ID are required'
      });
    }
    
    // Submit the vote
    const result = await voteService.createVote(user.id, ideaId, sessionId);
    
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Submit vote error:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit vote'
    });
  }
};

/**
 * Get vote status for a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getVoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const round = req.query.round ? parseInt(req.query.round, 10) : undefined;
    
    // Get vote status
    const status = voteService.getVoteStatus(id, round);
    
    return res.status(200).json({
      success: true,
      data: {
        status
      }
    });
  } catch (error) {
    console.error('Get vote status error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get vote status'
    });
  }
};

/**
 * Get vote results for a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getVoteResults = async (req, res) => {
  try {
    const { id } = req.params;
    const round = req.query.round ? parseInt(req.query.round, 10) : undefined;
    
    // Get vote results
    const results = voteService.getVoteResults(id, round);
    
    return res.status(200).json({
      success: true,
      data: {
        results
      }
    });
  } catch (error) {
    console.error('Get vote results error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get vote results'
    });
  }
};

/**
 * Check if user has voted in the current round
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const checkUserVoted = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Get session to determine current round
    const session = req.app.locals.Session.getSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Check if user has voted in the current round
    const hasVoted = req.app.locals.Vote.hasUserVotedInRound(
      user.id,
      id,
      session.current_round
    );
    
    return res.status(200).json({
      success: true,
      data: {
        hasVoted
      }
    });
  } catch (error) {
    console.error('Check user voted error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to check voting status'
    });
  }
}; 