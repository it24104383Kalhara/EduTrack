import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface SportActivity {
    id?: number;
    name: string;
    type: 'Sport' | 'Club' | 'Society';
    in_charge_staff_id?: number;
    description?: string;
}

export const getAllActivities = async (): Promise<SportActivity[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM sports_activities');
    return rows as SportActivity[];
};

export const createActivity = async (activity: SportActivity): Promise<number> => {
    const { name, type, in_charge_staff_id, description } = activity;
    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_activities (name, type, in_charge_staff_id, description) VALUES (?, ?, ?, ?)',
        [name, type, in_charge_staff_id, description]
    );
    return result.insertId;
};

export const deleteActivity = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM sports_activities WHERE id = ?', [id]);
};
