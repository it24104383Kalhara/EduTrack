import pool from '../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface AttendanceReport {
    id?: number;
    activity_id: number;
    coach_id: number;
    report_date: string;
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    notes?: string;
    report_details?: string;
    status?: 'Pending' | 'Approved' | 'Rejected';
    submitted_at?: string;
    reviewed_at?: string | null;
    reviewed_by?: number | null;
}

export interface TeacherNotification {
    id?: number;
    report_id: number;
    teacher_id: number;
    message: string;
    status?: 'Unread' | 'Read' | 'Actioned';
    sent_at?: string;
}

// ── Report CRUD ──────────────────────────────────────────────────────────────

export const createReport = async (report: AttendanceReport): Promise<number> => {
    const { activity_id, coach_id, report_date, total_students, present_count,
        absent_count, late_count, excused_count, notes, report_details } = report;
    const [result] = await pool.query<OkPacket>(
        `INSERT INTO sports_attendance_reports
         (activity_id, coach_id, report_date, total_students, present_count,
          absent_count, late_count, excused_count, notes, report_details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [activity_id, coach_id, report_date, total_students, present_count,
            absent_count, late_count, excused_count, notes || null, report_details || null]
    );
    return result.insertId;
};

export const getReports = async (
    status?: string,
    coachId?: number,
    activityId?: number
): Promise<AttendanceReport[]> => {
    let query = `SELECT r.*, a.name as activity_name
                 FROM sports_attendance_reports r
                 LEFT JOIN sports_activities a ON r.activity_id = a.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (status) { query += ' AND r.status = ?'; params.push(status); }
    if (coachId) { query += ' AND r.coach_id = ?'; params.push(coachId); }
    if (activityId) { query += ' AND r.activity_id = ?'; params.push(activityId); }

    query += ' ORDER BY r.submitted_at DESC';
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as AttendanceReport[];
};

export const getReportById = async (id: number): Promise<AttendanceReport | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT r.*, a.name as activity_name
         FROM sports_attendance_reports r
         LEFT JOIN sports_activities a ON r.activity_id = a.id
         WHERE r.id = ?`,
        [id]
    );
    return rows.length > 0 ? (rows[0] as AttendanceReport) : null;
};

export const updateReportStatus = async (
    id: number,
    status: 'Approved' | 'Rejected',
    reviewedBy: number
): Promise<void> => {
    await pool.query(
        `UPDATE sports_attendance_reports
         SET status = ?, reviewed_at = NOW(), reviewed_by = ?
         WHERE id = ?`,
        [status, reviewedBy, id]
    );
};

// ── Notifications ────────────────────────────────────────────────────────────

export const createNotification = async (notif: TeacherNotification): Promise<number> => {
    const { report_id, teacher_id, message } = notif;
    const [result] = await pool.query<OkPacket>(
        `INSERT INTO sports_teacher_notifications (report_id, teacher_id, message)
         VALUES (?, ?, ?)`,
        [report_id, teacher_id, message]
    );
    return result.insertId;
};

export const getNotificationsForTeacher = async (teacherId?: number): Promise<TeacherNotification[]> => {
    let query = `
        SELECT n.*, r.report_date, r.activity_id, a.name as activity_name,
               r.present_count, r.absent_count, r.total_students
        FROM sports_teacher_notifications n
        LEFT JOIN sports_attendance_reports r ON n.report_id = r.id
        LEFT JOIN sports_activities a ON r.activity_id = a.id
    `;
    const params: any[] = [];
    if (teacherId) {
        query += ` WHERE n.teacher_id = ?`;
        params.push(teacherId);
    }
    query += ` ORDER BY n.sent_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as TeacherNotification[];
};

export const markNotificationActioned = async (id: number): Promise<void> => {
    await pool.query(
        `UPDATE sports_teacher_notifications SET status = 'Actioned' WHERE id = ?`,
        [id]
    );
};

// ── Auto-generate report stats from DB ──────────────────────────────────────

export const buildReportStats = async (
    activityId: number,
    reportDate: string
): Promise<{ total: number; present: number; absent: number; late: number; excused: number; details: any[] }> => {
    // 1. Get stats
    const [statsRows] = await pool.query<RowDataPacket[]>(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN sa.status = 'Present' THEN 1 ELSE 0 END) as present,
           SUM(CASE WHEN sa.status = 'Absent'  THEN 1 ELSE 0 END) as absent,
           SUM(CASE WHEN sa.status = 'Late'    THEN 1 ELSE 0 END) as late,
           SUM(CASE WHEN sa.status = 'Excused' THEN 1 ELSE 0 END) as excused
         FROM sports_attendance sa
         INNER JOIN sports_practice_sessions ps ON sa.session_id = ps.id
         WHERE ps.activity_id = ?
           AND DATE(ps.start_time) = ?`,
        [activityId, reportDate]
    );

    // 2. Get details
    const [detailRows] = await pool.query<RowDataPacket[]>(
        `SELECT
           sa.student_id,
           sa.status,
           m.student_name,
           m.grade,
           m.class_teacher_name
         FROM sports_attendance sa
         INNER JOIN sports_practice_sessions ps ON sa.session_id = ps.id
         LEFT JOIN sports_memberships m ON sa.student_id = m.student_id AND m.activity_id = ps.activity_id
         WHERE ps.activity_id = ?
           AND DATE(ps.start_time) = ?`,
        [activityId, reportDate]
    );

    const r = statsRows[0];
    return {
        total: r.total || 0,
        present: r.present || 0,
        absent: r.absent || 0,
        late: r.late || 0,
        excused: r.excused || 0,
        details: detailRows as any[],
    };
};
