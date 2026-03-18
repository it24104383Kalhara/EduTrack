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
    // Manually delete dependent records to avoid Foreign Key constraint failures
    await pool.query('DELETE FROM sports_attendance WHERE session_id IN (SELECT id FROM sports_practice_sessions WHERE activity_id = ?)', [id]);
    await pool.query('DELETE FROM sports_practice_sessions WHERE activity_id = ?', [id]);
    await pool.query('DELETE FROM sports_memberships WHERE activity_id = ?', [id]);
    // Skip deleting matches and achievements as those tables might not exist yet
    
    const [reports] = await pool.query<RowDataPacket[]>('SELECT id FROM sports_attendance_reports WHERE activity_id = ?', [id]);
    if (reports.length > 0) {
        const reportIds = reports.map(r => r.id);
        await pool.query('DELETE FROM sports_teacher_notifications WHERE report_id IN (?)', [reportIds]);
    }
    await pool.query('DELETE FROM sports_attendance_reports WHERE activity_id = ?', [id]);
    
    // Finally, delete the activity itself
    await pool.query('DELETE FROM sports_activities WHERE id = ?', [id]);
};
