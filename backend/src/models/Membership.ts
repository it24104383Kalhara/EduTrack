import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface Membership {
    id?: number;
    student_id: number;
    activity_id: number;
    role: 'Member' | 'Captain' | 'Vice-Captain' | 'President' | 'Secretary' | 'Treasurer';
    joined_at: string; // Date string in YYYY-MM-DD format
    quit_at?: string | null;
}

export const registerStudentToActivity = async (membership: Membership): Promise<number> => {
    const { student_id, activity_id, role, joined_at } = membership;
    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_memberships (student_id, activity_id, role, joined_at) VALUES (?, ?, ?, ?)',
        [student_id, activity_id, role, joined_at]
    );
    return result.insertId;
};

export const getStudentMemberships = async (studentId: number): Promise<Membership[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_memberships WHERE student_id = ? AND quit_at IS NULL',
        [studentId]
    );
    return rows as Membership[];
};

export const getActivityMembers = async (activityId: number): Promise<Membership[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_memberships WHERE activity_id = ? AND quit_at IS NULL',
        [activityId]
    );
    return rows as Membership[];
};

export const removeStudentFromActivity = async (membershipId: number): Promise<void> => {
    await pool.query(
        'UPDATE sports_memberships SET quit_at = CURDATE() WHERE id = ?',
        [membershipId]
    );
};
