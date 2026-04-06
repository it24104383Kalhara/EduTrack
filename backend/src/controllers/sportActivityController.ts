import { Request, Response } from 'express';
import * as SportActivityModel from '../models/SportActivity';

export const getActivities = async (req: Request, res: Response) => {
    try {
        const activities = await SportActivityModel.getAllActivities();
        res.json(activities);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createActivity = async (req: Request, res: Response) => {
    try {
        const activity = req.body;
        const id = await SportActivityModel.createActivity(activity);
        res.status(201).json({ id, ...activity });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await SportActivityModel.deleteActivity(id);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
