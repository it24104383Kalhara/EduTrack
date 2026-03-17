import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface InventoryItem {
    id?: number;
    name: string;
    category?: string;
    total_quantity: number;
    available_quantity: number;
    condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';
    last_updated?: string;
}

export interface InventoryLog {
    id?: number;
    item_id: number;
    borrowed_by_id: number;
    borrowed_at?: string;
    returned_at?: string | null;
    status: 'Borrowed' | 'Returned' | 'Lost' | 'Damaged';
}

export interface InventoryReserved {
    id?: number;
    item_id: number;
    reserve_student_name: string;
    class_teacher: string;
    class_grade: string;
    reserve_start_time: string;
    reserve_end_time: string;
    reserved_at?: string;
    returned_at?: string | null;
    return_condition?: 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken' | null;
    status: 'Reserved' | 'Returned' | 'Cancelled';
    item_name?: string;
    quantity?: number;
}

// Inventory Item CRUD
export const getAllInventory = async (): Promise<InventoryItem[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM sports_inventory');
    return rows as InventoryItem[];
};

export const getInventoryById = async (id: number): Promise<InventoryItem | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_inventory WHERE id = ?',
        [id]
    );
    return rows.length > 0 ? (rows[0] as InventoryItem) : null;
};

export const createInventoryItem = async (item: InventoryItem): Promise<number> => {
    const { name, category, total_quantity, available_quantity, condition } = item;
    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_inventory (name, category, total_quantity, available_quantity, `condition`) VALUES (?, ?, ?, ?, ?)',
        [name, category, total_quantity, available_quantity, condition]
    );
    return result.insertId;
};

export const updateInventoryItem = async (id: number, item: Partial<InventoryItem>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (item.name !== undefined) { fields.push('name = ?'); values.push(item.name); }
    if (item.category !== undefined) { fields.push('category = ?'); values.push(item.category); }
    if (item.total_quantity !== undefined) { fields.push('total_quantity = ?'); values.push(item.total_quantity); }
    if (item.available_quantity !== undefined) { fields.push('available_quantity = ?'); values.push(item.available_quantity); }
    if (item.condition !== undefined) { fields.push('`condition` = ?'); values.push(item.condition); }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(
        `UPDATE sports_inventory SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM sports_inventory WHERE id = ?', [id]);
};

// Borrowing/Returning Logic
export const borrowItem = async (itemId: number, borrowedById: number): Promise<number> => {
    // Check if item is available
    const item = await getInventoryById(itemId);
    if (!item || item.available_quantity <= 0) {
        throw new Error('Item not available for borrowing');
    }

    // Decrease available quantity
    await pool.query(
        'UPDATE sports_inventory SET available_quantity = available_quantity - 1 WHERE id = ?',
        [itemId]
    );

    // Create log entry
    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_inventory_logs (item_id, borrowed_by_id, status) VALUES (?, ?, ?)',
        [itemId, borrowedById, 'Borrowed']
    );

    return result.insertId;
};

export const returnItem = async (logId: number, status: 'Returned' | 'Lost' | 'Damaged' = 'Returned'): Promise<void> => {
    // Get the log entry
    const [logs] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_inventory_logs WHERE id = ?',
        [logId]
    );

    if (logs.length === 0) {
        throw new Error('Borrowing record not found');
    }

    const log = logs[0];

    // Update log status and return time
    await pool.query(
        'UPDATE sports_inventory_logs SET status = ?, returned_at = NOW() WHERE id = ?',
        [status, logId]
    );

    // Increase available quantity only if returned (not lost/damaged)
    if (status === 'Returned') {
        await pool.query(
            'UPDATE sports_inventory SET available_quantity = available_quantity + 1 WHERE id = ?',
            [log.item_id]
        );
    }
};

export const getBorrowingHistory = async (itemId?: number, userId?: number): Promise<InventoryLog[]> => {
    let query = 'SELECT * FROM sports_inventory_logs WHERE 1=1';
    const params: any[] = [];

    if (itemId) {
        query += ' AND item_id = ?';
        params.push(itemId);
    }

    if (userId) {
        query += ' AND borrowed_by_id = ?';
        params.push(userId);
    }

    query += ' ORDER BY borrowed_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as InventoryLog[];
};

// Reserved Items Logic

export const getReservedItems = async (): Promise<InventoryReserved[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT r.*, i.name as item_name 
         FROM sports_inventory_reserved r
         JOIN sports_inventory i ON r.item_id = i.id
         ORDER BY r.reserved_at DESC`
    );
    return rows as InventoryReserved[];
};

export const reserveItem = async (reservedItem: InventoryReserved): Promise<number> => {
    // Check if item is available
    const item = await getInventoryById(reservedItem.item_id);
    const qty = reservedItem.quantity || 1;
    if (!item || item.available_quantity < qty) {
        throw new Error('Not enough items available for reservation');
    }

    // Decrease available quantity
    await pool.query(
        'UPDATE sports_inventory SET available_quantity = available_quantity - ? WHERE id = ?',
        [qty, reservedItem.item_id]
    );

    // Create log entry
    const [result] = await pool.query<OkPacket>(
        `INSERT INTO sports_inventory_reserved 
        (item_id, reserve_student_name, class_teacher, class_grade, reserve_start_time, reserve_end_time, status, quantity) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            reservedItem.item_id,
            reservedItem.reserve_student_name,
            reservedItem.class_teacher,
            reservedItem.class_grade,
            reservedItem.reserve_start_time,
            reservedItem.reserve_end_time,
            reservedItem.status || 'Reserved',
            qty
        ]
    );

    return result.insertId;
};

export const returnReservedItem = async (logId: number, status: 'Returned' | 'Cancelled', returnCondition?: 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken'): Promise<void> => {
    // Get the log entry
    const [logs] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_inventory_reserved WHERE id = ?',
        [logId]
    );

    if (logs.length === 0) {
        throw new Error('Reservation record not found');
    }

    const log = logs[0];

    // Update log status and return time
    if (status === 'Returned' && returnCondition) {
        await pool.query(
            'UPDATE sports_inventory_reserved SET status = ?, returned_at = NOW(), return_condition = ? WHERE id = ?',
            [status, returnCondition, logId]
        );
        // Change condition of inventory if not Good/New but Fair/Poor/Broken
        await pool.query(
            'UPDATE sports_inventory SET `condition` = ? WHERE id = ?',
            [returnCondition, log.item_id]
        );
    } else {
        await pool.query(
            'UPDATE sports_inventory_reserved SET status = ?, returned_at = NOW() WHERE id = ?',
            [status, logId]
        );
    }

    // Increase available quantity
    await pool.query(
        'UPDATE sports_inventory SET available_quantity = available_quantity + ? WHERE id = ?',
        [log.quantity || 1, log.item_id]
    );
};
