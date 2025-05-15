import express, { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Register a new user with a name
 * 
 * @route POST /api/auth/register
 * @param {string} name - The user's display name
 * @returns {Object} Object containing user ID and name
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid name is required',
      });
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Validate a user session
 * 
 * @route GET /api/auth/validate
 * @param {string} x-user-id - The user's ID (header)
 * @returns {Object} User object if valid
 */
router.get('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    // User is already validated by authMiddleware
    return res.status(200).json({
      success: true,
      data: {
        id: req.user?.id,
        name: req.user?.name,
      },
    });
  } catch (error) {
    console.error('Validate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router; 