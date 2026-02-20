import express from 'express';
import * as studentController from '../controllers/studentController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Mock endpoint for searching students by name or ID
router.get('/search', authenticate, studentController.searchStudents);

export default router;
