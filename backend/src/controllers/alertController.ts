import { Response } from 'express';
import * as AlertModel from '../models/Alert';
import { AuthRequest } from '../middleware/authMiddleware';

// Initialize alerts table (run once)
export const initializeAlerts = async (req: AuthRequest, res: Response) => {
    try {
        await AlertModel.createAlertsTable();
        res.json({ message: 'Alerts table initialized successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Alert CRUD
export const createAlert = async (req: AuthRequest, res: Response) => {
    try {
        const alert = req.body;

        if (!alert.alert_type || !alert.title || !alert.message) {
            return res.status(400).json({
                error: 'alert_type, title, and message are required'
            });
        }

        // Set created_by_id from authenticated user if not provided
        if (!alert.created_by_id && req.user) {
            alert.created_by_id = req.user.id;
        }

        const id = await AlertModel.createAlert(alert);
        res.status(201).json({ id, ...alert });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getAlerts = async (req: AuthRequest, res: Response) => {
    try {
        const filters = {
            status: req.query.status as string | undefined,
            alert_type: req.query.alert_type as string | undefined,
            severity: req.query.severity as string | undefined,
            student_id: req.query.student_id ? parseInt(req.query.student_id as string) : undefined
        };

        const alerts = await AlertModel.getAlerts(filters);
        res.json(alerts);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getAlert = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const alert = await AlertModel.getAlertById(id);

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(alert);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateAlertStatus = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const { status } = req.body;

        if (!status || !['Acknowledged', 'Resolved'].includes(status)) {
            return res.status(400).json({
                error: 'status must be Acknowledged or Resolved'
            });
        }

        await AlertModel.updateAlertStatus(id, status);
        res.json({ message: 'Alert status updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAlert = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await AlertModel.deleteAlert(id);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Automatic Missing Student Detection
export const checkMissingStudents = async (req: AuthRequest, res: Response) => {
    try {
        const sessionId = parseInt(req.params.sessionId as string);
        const alertCount = await AlertModel.checkMissingStudents(sessionId);

        res.json({
            message: `Checked for missing students`,
            alerts_created: alertCount,
            session_id: sessionId
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Alert Statistics
export const getAlertStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await AlertModel.getAlertStatistics();
        res.json(stats);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
