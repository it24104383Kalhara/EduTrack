import express from 'express';
import * as achievementController from '../controllers/achievementController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Match Results
router.post('/matches', authenticate, authorize(['Admin', 'Coach']), achievementController.createMatch);
router.get('/matches', authenticate, achievementController.getMatches);
router.put('/matches/:id', authenticate, authorize(['Admin', 'Coach']), achievementController.updateMatch);
router.delete('/matches/:id', authenticate, authorize(['Admin', 'Coach']), achievementController.deleteMatch);
router.get('/matches/:id/participants', authenticate, achievementController.getMatchParticipants);

// Achievements & Merit Points
router.post('/achievements', authenticate, authorize(['Admin', 'Coach']), achievementController.addAchievement);
router.post('/achievements/recalc-attendance', authenticate, authorize(['Admin', 'Coach']), achievementController.recalcAttendance);

// CV, Leaderboard, Analytics
router.get('/cv/:studentId', authenticate, achievementController.getStudentCV);
router.get('/leaderboard', authenticate, achievementController.getLeaderboard);
router.get('/analytics/timeseries', authenticate, achievementController.getTimeSeries);

export default router;
