import express from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Practice Session Management
router.post('/sessions', authenticate, authorize(['Admin', 'Coach']), attendanceController.createSession);
router.get('/sessions', authenticate, attendanceController.getSessions);
router.get('/sessions/:id', authenticate, attendanceController.getSession);
router.delete('/sessions/:id', authenticate, authorize(['Admin', 'Coach']), attendanceController.deleteSession);

// Attendance Marking
router.post('/mark', authenticate, authorize(['Admin', 'Coach']), attendanceController.markAttendance);
router.post('/mark-bulk', authenticate, authorize(['Admin', 'Coach']), attendanceController.bulkMarkAttendance);

// View Attendance
router.get('/session/:sessionId', authenticate, attendanceController.getSessionAttendance);
router.get('/student/:studentId', authenticate, attendanceController.getStudentAttendance);
router.get('/student/:studentId/stats', authenticate, attendanceController.getAttendanceStats);

// Verification (for teachers to check if student has practice)
router.get('/verify/:studentId', authenticate, authorize(['Admin', 'Coach', 'Teacher']), attendanceController.verifyStudentPractice);

export default router;
