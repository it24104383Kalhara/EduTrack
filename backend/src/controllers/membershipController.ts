import { Response } from 'express';
import * as MembershipModel from '../models/Membership';
import { AuthRequest } from '../middleware/authMiddleware';

export const registerStudent = async (req: AuthRequest, res: Response) => {
    try {
        const { student_id, student_name, activity_id, role, grade, class_teacher_name } = req.body;

        // Validate required fields
        if (!student_id || !activity_id) {
            return res.status(400).json({ error: 'student_id and activity_id are required' });
        }

        const membership = {
            student_id,
            student_name,
            activity_id,
            role: role || 'Member',
            grade,
            class_teacher_name,
            joined_at: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD
        };

        const id = await MembershipModel.registerStudentToActivity(membership);
        res.status(201).json({ id, ...membership });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getStudentActivities = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = parseInt(req.params.studentId as string);
        const memberships = await MembershipModel.getStudentMemberships(studentId);
        res.json(memberships);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getActivityMembers = async (req: AuthRequest, res: Response) => {
    try {
        const activityId = parseInt(req.params.activityId as string);
        const members = await MembershipModel.getActivityMembers(activityId);
        res.json(members);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const removeStudent = async (req: AuthRequest, res: Response) => {
    try {
        const membershipId = parseInt(req.params.id as string);
        await MembershipModel.removeStudentFromActivity(membershipId);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
