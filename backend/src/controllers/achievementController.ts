import { Response } from 'express';
import * as AchievementModel from '../models/Achievement';
import { AuthRequest } from '../middleware/authMiddleware';

// ── Matches ──────────────────────────────────────────────────────────────────

export const createMatch = async (req: AuthRequest, res: Response) => {
    try {
        const { participants, ...matchData } = req.body;
        if (!matchData.activity_id || !matchData.date || !matchData.opponent || !matchData.result) {
            return res.status(400).json({ error: 'activity_id, date, opponent, and result are required' });
        }
        const id = await AchievementModel.createMatch(matchData);

        // Save participants
        const studentIds: number[] = Array.isArray(participants) ? participants.map(Number) : [];
        if (studentIds.length > 0) {
            await AchievementModel.setMatchParticipants(id, studentIds);
            // Auto-award points
            await AchievementModel.awardMatchPoints(id);
        }

        res.status(201).json({ id, ...matchData, participants: studentIds });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMatches = async (req: AuthRequest, res: Response) => {
    try {
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id as string) : undefined;
        const matches = await AchievementModel.getMatches(activityId);
        res.json(matches);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateMatch = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const { participants, ...updates } = req.body;
        await AchievementModel.updateMatchResult(id, updates);

        if (Array.isArray(participants)) {
            await AchievementModel.setMatchParticipants(id, participants.map(Number));
            await AchievementModel.awardMatchPoints(id);
        }

        res.json({ message: 'Match updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteMatch = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await AchievementModel.deleteMatch(id);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMatchParticipants = async (req: AuthRequest, res: Response) => {
    try {
        const matchId = parseInt(req.params.id as string);
        const participants = await AchievementModel.getMatchParticipants(matchId);
        res.json(participants);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── Achievements ─────────────────────────────────────────────────────────────

export const addAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const achievement = req.body;
        if (!achievement.student_id || !achievement.title || achievement.merit_points === undefined) {
            return res.status(400).json({ error: 'student_id, title, and merit_points are required' });
        }
        const id = await AchievementModel.addAchievement(achievement);
        res.status(201).json({ id, ...achievement });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const recalcAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { student_id, activity_id } = req.body;
        if (!student_id || !activity_id) {
            return res.status(400).json({ error: 'student_id and activity_id are required' });
        }
        const points = await AchievementModel.recalcAttendancePoints(parseInt(student_id), parseInt(activity_id));
        res.json({ points });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── CV & Leaderboard ─────────────────────────────────────────────────────────

export const getStudentCV = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = parseInt(req.params.studentId as string);
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id as string) : undefined;
        const cv = await AchievementModel.getStudentSportsCV(studentId, activityId);
        res.json(cv);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
    try {
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const leaderboard = await AchievementModel.getLeaderboard(activityId, limit);
        res.json(leaderboard);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getTimeSeries = async (req: AuthRequest, res: Response) => {
    try {
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id as string) : undefined;
        const period = (req.query.period as 'weekly' | 'monthly' | 'yearly') || 'monthly';
        const data = await AchievementModel.getPointsTimeSeries(activityId, period);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
