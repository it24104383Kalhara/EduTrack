import { Response } from 'express';
import * as InventoryModel from '../models/Inventory';
import { AuthRequest } from '../middleware/authMiddleware';

// Inventory Item Management
export const getInventory = async (req: AuthRequest, res: Response) => {
    try {
        const items = await InventoryModel.getAllInventory();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getInventoryItem = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const item = await InventoryModel.getInventoryById(id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(item);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createInventoryItem = async (req: AuthRequest, res: Response) => {
    try {
        const item = req.body;

        // Validate required fields
        if (!item.name || item.total_quantity === undefined) {
            return res.status(400).json({ error: 'name and total_quantity are required' });
        }

        // Set available_quantity to total_quantity if not provided
        if (item.available_quantity === undefined) {
            item.available_quantity = item.total_quantity;
        }

        const id = await InventoryModel.createInventoryItem(item);
        res.status(201).json({ id, ...item });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const updates = req.body;

        await InventoryModel.updateInventoryItem(id, updates);
        res.json({ message: 'Item updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await InventoryModel.deleteInventoryItem(id);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Borrowing/Returning
export const borrowItem = async (req: AuthRequest, res: Response) => {
    try {
        const { item_id, borrowed_by_id } = req.body;

        if (!item_id || !borrowed_by_id) {
            return res.status(400).json({ error: 'item_id and borrowed_by_id are required' });
        }

        const logId = await InventoryModel.borrowItem(item_id, borrowed_by_id);
        res.status(201).json({
            log_id: logId,
            message: 'Item borrowed successfully'
        });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const returnItem = async (req: AuthRequest, res: Response) => {
    try {
        const logId = parseInt(req.params.logId as string);
        const { status } = req.body;

        await InventoryModel.returnItem(logId, status || 'Returned');
        res.json({ message: 'Item returned successfully' });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const getBorrowingHistory = async (req: AuthRequest, res: Response) => {
    try {
        const itemId = req.query.item_id ? parseInt(req.query.item_id as string) : undefined;
        const userId = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;

        const history = await InventoryModel.getBorrowingHistory(itemId, userId);
        res.json(history);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Reserved Items Logic

export const getReservedItems = async (req: AuthRequest, res: Response) => {
    try {
        const items = await InventoryModel.getReservedItems();
        res.json(items);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const reserveItem = async (req: AuthRequest, res: Response) => {
    try {
        const reserveData = req.body;

        if (!reserveData.item_id || !reserveData.reserve_student_name || !reserveData.class_teacher || !reserveData.class_grade || !reserveData.reserve_start_time || !reserveData.reserve_end_time) {
            return res.status(400).json({ error: 'Missing required reservation fields' });
        }

        const logId = await InventoryModel.reserveItem(reserveData);
        res.status(201).json({
            log_id: logId,
            message: 'Item reserved successfully'
        });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const returnReservedItem = async (req: AuthRequest, res: Response) => {
    try {
        const logId = parseInt(req.params.logId as string);
        const { status, return_condition } = req.body;

        await InventoryModel.returnReservedItem(logId, status || 'Returned', return_condition);
        res.json({ message: 'Reserved item returned successfully' });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
