import pool from '../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface Membership {
    id?: number;
    student_id: number;
    student_name?: string;
    activity_id: number;
    role: 'Member' | 'Captain' | 'Vice-Captain' | 'President' | 'Secretary' | 'Treasurer';
    grade?: string;
    class_teacher_name?: string;
    joined_at: string; // Date string in YYYY-MM-DD format
    quit_at?: string | null;
}

export const registerStudentToActivity = async (membership: Membership): Promise<number> => {
    const { student_id, student_name, activity_id, role, grade, class_teacher_name, joined_at } = membership;
    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_memberships (student_id, student_name, activity_id, role, grade, class_teacher_name, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [student_id, student_name || null, activity_id, role, grade || null, class_teacher_name || null, joined_at]
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

export const checkExistingMembership = async (studentId: number, activityId: number): Promise<Membership | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_memberships WHERE student_id = ? AND activity_id = ? AND quit_at IS NULL',
        [studentId, activityId]
    );
    return rows.length > 0 ? (rows[0] as Membership) : null;
};

export const checkExistingRoleInActivity = async (activityId: number, role: string): Promise<Membership | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_memberships WHERE activity_id = ? AND role = ? AND quit_at IS NULL',
        [activityId, role]
    );
    return rows.length > 0 ? (rows[0] as Membership) : null;
};
