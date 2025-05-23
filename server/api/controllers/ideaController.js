import * as ideaService from '../../services/ideaService.js';

/**
 * Create a new idea
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createIdea = async (req, res) => {
  try {
    const { content } = req.body;
    const { user } = req;
    const sessionId = req.params.id || req.body.sessionId;
    
    if (!content || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Content and session ID are required'
      });
    }
    
    if (content.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Idea content must be at least 3 characters'
      });
    }
    
    if (content.trim().length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Idea content must be at most 200 characters'
      });
    }
    
    // Create the idea
    const idea = ideaService.createIdea(content, user.id, sessionId);
    
    return res.status(201).json({
      success: true,
      data: {
        idea
      }
    });
  } catch (error) {
    console.error('Create idea error:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create idea'
    });
  }
};

/**
 * Get ideas for a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getIdeasBySession = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get ideas for the session
    const ideas = ideaService.getIdeasBySessionId(id);
    
    return res.status(200).json({
      success: true,
      data: {
        ideas
      }
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get ideas'
    });
  }
};

/**
 * Get ideas created by the current user for a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getUserIdeasForSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Get user's ideas for the session
    const ideas = ideaService.getIdeasBySessionAndAuthor(id, user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        ideas
      }
    });
  } catch (error) {
    console.error('Get user ideas error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get ideas'
    });
  }
};

/**
 * Get candidate ideas for voting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getCandidateIdeas = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get candidate ideas for voting
    const ideas = ideaService.getCandidateIdeasForVoting(id);
    
    return res.status(200).json({
      success: true,
      data: {
        ideas
      }
    });
  } catch (error) {
    console.error('Get candidate ideas error:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get candidate ideas'
    });
  }
};

/**
 * Get winning ideas for a completed session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getWinningIdeas = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get winning ideas
    const ideas = ideaService.getWinningIdeas(id);
    
    return res.status(200).json({
      success: true,
      data: {
        ideas
      }
    });
  } catch (error) {
    console.error('Get winning ideas error:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get winning ideas'
    });
  }
}; 