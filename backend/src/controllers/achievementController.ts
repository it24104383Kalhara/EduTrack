import { Response } from 'express';
import * as AchievementModel from '../models/Achievement';
import { AuthRequest } from '../middleware/authMiddleware';

// Match Controllers
export const createMatch = async (req: AuthRequest, res: Response) => {
    try {
        const matchData = req.body;
        // Basic validation
        if (!matchData.activity_id || !matchData.date || !matchData.opponent) {
            return res.status(400).json({ error: 'activity_id, date, and opponent are required' });
        }

        const id = await AchievementModel.createMatch(matchData);
        res.status(201).json({
            id,
            message: 'Match created successfully',
            ...matchData
        });
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
        const updates = req.body;

        await AchievementModel.updateMatchResult(id, updates);
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

// Achievement Controllers
export const addAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const achievement = req.body;

        // Basic validation
        if (!achievement.student_id || !achievement.title || achievement.merit_points === undefined) {
            return res.status(400).json({ error: 'student_id, title, and merit_points are required' });
        }

        const id = await AchievementModel.addAchievement(achievement);
        res.status(201).json({
            id,
            message: 'Achievement added successfully',
            ...achievement
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getStudentCV = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = parseInt(req.params.studentId as string);
        const cv = await AchievementModel.getStudentSportsCV(studentId);
        res.json(cv);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const leaderboard = await AchievementModel.getLeaderboard(limit);
        res.json(leaderboard);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
