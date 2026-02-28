import express from 'express';
import * as ctrl from '../controllers/attendanceReportController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Coach: generate + submit a daily report
router.post('/', authenticate, authorize(['Admin', 'Coach']), ctrl.generateReport);

// Principal / Admin / Coach: view all reports (filterable by ?status=Pending|Approved|Rejected)
router.get('/', authenticate, authorize(['Admin', 'Principal', 'Coach']), ctrl.getReports);

// Anyone authenticated: view single report
router.get('/:id', authenticate, ctrl.getReport);

// Principal: approve or reject
router.put('/:id/review', authenticate, authorize(['Admin', 'Principal']), ctrl.reviewReport);

// Principal: notify a teacher after approval
router.post('/:id/notify-teacher', authenticate, authorize(['Admin', 'Principal']), ctrl.notifyTeacher);

// Teacher (or Admin/Coach testing): get their notifications
router.get('/notifications/mine', authenticate, ctrl.getMyNotifications);

// Teacher: mark a notification as actioned
router.put('/notifications/:id/action', authenticate, authorize(['Admin', 'Teacher']), ctrl.actionNotification);

export default router;
