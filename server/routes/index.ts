import express from 'express';
import authRoutes from './auth';
import sessionRoutes from './sessions';

const router = express.Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount session routes
router.use('/sessions', sessionRoutes);

// Add additional route groups here as they are implemented

export default router; 