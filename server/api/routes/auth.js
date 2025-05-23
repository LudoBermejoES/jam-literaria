import express from 'express';
import { register, getCurrentUser, logout } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', authMiddleware, logout);

export default router; 