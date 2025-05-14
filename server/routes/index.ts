import express from 'express';
import authRoutes from './auth';

const router = express.Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Add additional route groups here as they are implemented
// e.g., router.use('/sessions', sessionRoutes);

export default router; 