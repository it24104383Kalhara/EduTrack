import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as ReportModel from '../models/AttendanceReport';

// ── Coach: Generate & submit report ─────────────────────────────────────────

export const generateReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { activity_id, report_date, notes } = req.body;
        const coachId = parseInt(req.headers['x-user-id'] as string) || 1;

        if (!activity_id || !report_date) {
            res.status(400).json({ error: 'activity_id and report_date are required' });
            return;
        }

        // Pull live stats from DB for that activity + date
        const stats = await ReportModel.buildReportStats(activity_id, report_date);

        const reportId = await ReportModel.createReport({
            activity_id,
            coach_id: coachId,
            report_date,
            total_students: stats.total,
            present_count: stats.present,
            absent_count: stats.absent,
            late_count: stats.late,
            excused_count: stats.excused,
            notes,
            report_details: JSON.stringify(stats.details),
        });

        const report = await ReportModel.getReportById(reportId);
        res.status(201).json(report);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── Principal: Get all reports ────────────────────────────────────────────────

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const status = req.query.status as string | undefined;
        const coachId = req.query.coach_id ? parseInt(req.query.coach_id as string) : undefined;
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id as string) : undefined;

        const reports = await ReportModel.getReports(status, coachId, activityId);
        res.json(reports);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── Principal: Get single report ──────────────────────────────────────────────

export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params['id'] as string);
        const report = await ReportModel.getReportById(id);
        if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
        res.json(report);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── Principal: Approve or Reject report ──────────────────────────────────────

export const reviewReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params['id'] as string);
        const { status } = req.body as { status: 'Approved' | 'Rejected' };
        const principalId = parseInt(req.headers['x-user-id'] as string) || 1;

        if (!['Approved', 'Rejected'].includes(status)) {
            res.status(400).json({ error: 'status must be Approved or Rejected' });
            return;
        }

        const report = await ReportModel.getReportById(id);
        if (!report) { res.status(404).json({ error: 'Report not found' }); return; }

        await ReportModel.updateReportStatus(id, status, principalId);
        res.json({ message: `Report ${status.toLowerCase()} successfully`, id, status });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── Principal: Notify Teacher ──────────────────────────────────────────────────

export const notifyTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reportId = parseInt(req.params['id'] as string);
        const { teacher_id, message } = req.body;

        if (!teacher_id || !message) {
            res.status(400).json({ error: 'teacher_id and message are required' });
            return;
        }

        const report = await ReportModel.getReportById(reportId);
        if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
        if (report.status !== 'Approved') {
            res.status(400).json({ error: 'Only approved reports can be sent to teachers' });
            return;
        }

        const notifId = await ReportModel.createNotification({ report_id: reportId, teacher_id, message });
        res.status(201).json({ id: notifId, report_id: reportId, teacher_id, message, status: 'Unread' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── Teacher: Get notifications ────────────────────────────────────────────────

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // DEMO BYPASS: Return all notifications instead of filtering by teacherId
        // so the user can see them regardless of what login role/id they are using
        const notifications = await ReportModel.getNotificationsForTeacher();
        res.json(notifications);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// ── Teacher: Mark notification actioned ──────────────────────────────────────

export const actionNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params['id'] as string);
        await ReportModel.markNotificationActioned(id);
        res.json({ message: 'Notification marked as actioned', id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
