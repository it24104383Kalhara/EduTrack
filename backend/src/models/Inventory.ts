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
