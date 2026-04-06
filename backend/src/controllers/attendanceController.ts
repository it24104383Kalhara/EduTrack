import { Response } from 'express';
import * as PracticeSessionModel from '../models/PracticeSession';
import { AuthRequest } from '../middleware/authMiddleware';

// Practice Session Management
export const createSession = async (req: AuthRequest, res: Response) => {
    try {
        const session = req.body;

        if (!session.activity_id || !session.coach_id || !session.start_time || !session.end_time) {
            return res.status(400).json({
                error: 'activity_id, coach_id, start_time, and end_time are required'
            });
        }

        const id = await PracticeSessionModel.createPracticeSession(session);
        res.status(201).json({ id, ...session });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
    try {
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id as string) : undefined;
        const coachId = req.query.coach_id ? parseInt(req.query.coach_id as string) : undefined;

        const sessions = await PracticeSessionModel.getPracticeSessions(activityId, coachId);
        res.json(sessions);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getSession = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const session = await PracticeSessionModel.getSessionById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await PracticeSessionModel.deletePracticeSession(id);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Attendance Management
export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const attendance = req.body;

        if (!attendance.session_id || !attendance.student_id || !attendance.status) {
            return res.status(400).json({
                error: 'session_id, student_id, and status are required'
            });
        }

        const id = await PracticeSessionModel.markAttendance(attendance);
        res.status(201).json({
            id,
            ...attendance,
            message: 'Attendance marked successfully'
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const bulkMarkAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { session_id, attendances } = req.body;

        if (!session_id || !Array.isArray(attendances)) {
            return res.status(400).json({
                error: 'session_id and attendances array are required'
            });
        }

        const results = [];
        for (const att of attendances) {
            const id = await PracticeSessionModel.markAttendance({
                session_id,
                student_id: att.student_id,
                status: att.status
            });
            results.push({ id, student_id: att.student_id, status: att.status });
        }

        res.status(201).json({
            message: 'Bulk attendance marked successfully',
            count: results.length,
            results
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getSessionAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const sessionId = parseInt(req.params.sessionId as string);
        const attendance = await PracticeSessionModel.getAttendanceBySession(sessionId);
        res.json(attendance);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = parseInt(req.params.studentId as string);
        const attendance = await PracticeSessionModel.getAttendanceByStudent(studentId);
        res.json(attendance);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Verification for Teachers
export const verifyStudentPractice = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = parseInt(req.params.studentId as string);
        const checkTime = req.query.time as string | undefined;

        const session = await PracticeSessionModel.verifyStudentPractice(studentId, checkTime);

        if (!session) {
            return res.json({
                has_practice: false,
                message: 'Student does not have a scheduled practice at this time'
            });
        }

        res.json({
            has_practice: true,
            session,
            message: 'Student has a valid practice session'
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Attendance Statistics
export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = parseInt(req.params.studentId as string);
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id as string) : undefined;

        const stats = await PracticeSessionModel.getStudentAttendanceStats(studentId, activityId);
        res.json(stats);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
