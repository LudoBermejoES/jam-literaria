import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Middleware to check if user is authenticated with a valid session
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from request headers
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication',
      });
    }

    // Update user's last active timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });

    // Add user to request for use in route handlers
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Middleware to check if user is a member of the specified session
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const sessionMemberMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and session ID are required',
      });
    }

    // Check if user is a member of the session
    const session = await prisma.session.findFirst({
      where: { 
        id: sessionId,
        OR: [
          { ownerId: userId },
          { participants: { some: { id: userId } } }
        ]
      },
    });

    if (!session) {
      return res.status(403).json({
        success: false,
        message: 'User is not a member of this session',
      });
    }

    // Add session to request for use in route handlers
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Session member middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Middleware to check if user is the owner of the specified session
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const sessionOwnerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and session ID are required',
      });
    }

    // Check if user is the owner of the session
    const session = await prisma.session.findFirst({
      where: { 
        id: sessionId,
        ownerId: userId
      },
    });

    if (!session) {
      return res.status(403).json({
        success: false,
        message: 'User is not the owner of this session',
      });
    }

    // Add session to request for use in route handlers
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Session owner middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}; 