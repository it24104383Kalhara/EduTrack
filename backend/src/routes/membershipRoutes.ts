import express from 'express';
import * as membershipController from '../controllers/membershipController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Register a student to an activity (Admin/Coach only)
router.post('/register', authenticate, authorize(['Admin', 'Coach']), membershipController.registerStudent);

// Get all activities a student is registered for
router.get('/student/:studentId', authenticate, membershipController.getStudentActivities);

// Get all members of a specific activity
router.get('/activity/:activityId', authenticate, membershipController.getActivityMembers);

// Remove a student from an activity (Admin/Coach only)
router.delete('/:id', authenticate, authorize(['Admin', 'Coach']), membershipController.removeStudent);

export default router;
