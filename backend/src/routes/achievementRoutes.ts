import express from 'express';
import * as achievementController from '../controllers/achievementController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Match Results
router.post('/matches', authenticate, authorize(['Admin', 'Coach']), achievementController.createMatch);
router.get('/matches', authenticate, achievementController.getMatches);
router.put('/matches/:id', authenticate, authorize(['Admin', 'Coach']), achievementController.updateMatch);
router.delete('/matches/:id', authenticate, authorize(['Admin']), achievementController.deleteMatch);

// Achievemnts & Merit Points
router.post('/achievements', authenticate, authorize(['Admin', 'Coach']), achievementController.addAchievement);
router.get('/cv/:studentId', authenticate, achievementController.getStudentCV);
router.get('/leaderboard', authenticate, achievementController.getLeaderboard);

export default router;
