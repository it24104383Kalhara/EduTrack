import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface PracticeSession {
    id?: number;
    activity_id: number;
    coach_id: number;
    start_time: string; // ISO datetime string
    end_time: string;
    location_id?: number | null;
}

export interface Attendance {
    id?: number;
    session_id: number;
    student_id: number;
    status: 'Present' | 'Absent' | 'Excused' | 'Late';
    recorded_at?: string;
}

// Practice Session CRUD
export const createPracticeSession = async (session: PracticeSession): Promise<number> => {
    const { activity_id, coach_id, start_time, end_time, location_id } = session;
    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_practice_sessions (activity_id, coach_id, start_time, end_time, location_id) VALUES (?, ?, ?, ?, ?)',
        [activity_id, coach_id, start_time, end_time, location_id]
    );
    return result.insertId;
};

export const getPracticeSessions = async (activityId?: number, coachId?: number): Promise<PracticeSession[]> => {
    let query = 'SELECT * FROM sports_practice_sessions WHERE 1=1';
    const params: any[] = [];

    if (activityId) {
        query += ' AND activity_id = ?';
        params.push(activityId);
    }

    if (coachId) {
        query += ' AND coach_id = ?';
        params.push(coachId);
    }

    query += ' ORDER BY start_time DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as PracticeSession[];
};

export const getSessionById = async (id: number): Promise<PracticeSession | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_practice_sessions WHERE id = ?',
        [id]
    );
    return rows.length > 0 ? (rows[0] as PracticeSession) : null;
};

export const deletePracticeSession = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM sports_practice_sessions WHERE id = ?', [id]);
};

// Attendance Management
export const markAttendance = async (attendance: Attendance): Promise<number> => {
    const { session_id, student_id, status } = attendance;

    // Check if attendance already exists for this student in this session
    const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM sports_attendance WHERE session_id = ? AND student_id = ?',
        [session_id, student_id]
    );

    if (existing.length > 0) {
        // Update existing attendance
        await pool.query(
            'UPDATE sports_attendance SET status = ?, recorded_at = NOW() WHERE id = ?',
            [status, existing[0].id]
        );
        return existing[0].id;
    } else {
        // Create new attendance record
        const [result] = await pool.query<OkPacket>(
            'INSERT INTO sports_attendance (session_id, student_id, status) VALUES (?, ?, ?)',
            [session_id, student_id, status]
        );
        return result.insertId;
    }
};

export const getAttendanceBySession = async (sessionId: number): Promise<Attendance[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_attendance WHERE session_id = ? ORDER BY student_id',
        [sessionId]
    );
    return rows as Attendance[];
};

export const getAttendanceByStudent = async (studentId: number): Promise<Attendance[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_attendance WHERE student_id = ? ORDER BY recorded_at DESC',
        [studentId]
    );
    return rows as Attendance[];
};

// Verification: Check if student has a valid practice session at a given time
export const verifyStudentPractice = async (studentId: number, checkTime?: string): Promise<PracticeSession | null> => {
    const timeToCheck = checkTime || new Date().toISOString();

    // Find active sessions for this student at the given time
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ps.* 
         FROM sports_practice_sessions ps
         INNER JOIN sports_memberships sm ON ps.activity_id = sm.activity_id
         WHERE sm.student_id = ? 
         AND sm.quit_at IS NULL
         AND ps.start_time <= ? 
         AND ps.end_time >= ?
         LIMIT 1`,
        [studentId, timeToCheck, timeToCheck]
    );

    return rows.length > 0 ? (rows[0] as PracticeSession) : null;
};

// Get attendance statistics for a student
export interface AttendanceStats {
    student_id: number;
    total_sessions: number;
    present: number;
    absent: number;
    excused: number;
    late: number;
    attendance_rate: number;
}

export const getStudentAttendanceStats = async (studentId: number, activityId?: number): Promise<AttendanceStats> => {
    let query = `
        SELECT 
            student_id,
            COUNT(*) as total_sessions,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) as excused,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
        FROM sports_attendance sa
        INNER JOIN sports_practice_sessions ps ON sa.session_id = ps.id
        WHERE sa.student_id = ?
    `;

    const params: any[] = [studentId];

    if (activityId) {
        query += ' AND ps.activity_id = ?';
        params.push(activityId);
    }

    query += ' GROUP BY student_id';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    if (rows.length === 0) {
        return {
            student_id: studentId,
            total_sessions: 0,
            present: 0,
            absent: 0,
            excused: 0,
            late: 0,
            attendance_rate: 0
        };
    }

    const stats = rows[0];
    const attendanceRate = stats.total_sessions > 0
        ? ((stats.present + stats.late) / stats.total_sessions) * 100
        : 0;

    return {
        ...stats,
        attendance_rate: Math.round(attendanceRate * 100) / 100
    } as AttendanceStats;
};
