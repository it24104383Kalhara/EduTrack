import express from 'express';
import * as activityController from '../controllers/sportActivityController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Public route - anyone can view activities
router.get('/activities', activityController.getActivities);

// Protected routes - only Admin and Coach can create/delete
router.post('/activities', authenticate, authorize(['Admin', 'Coach']), activityController.createActivity);
router.delete('/activities/:id', authenticate, authorize(['Admin', 'Coach']), activityController.deleteActivity);

export default router;
