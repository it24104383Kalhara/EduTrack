import pool from '../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface Alert {
    id?: number;
    alert_type: 'Missing_Student' | 'Equipment_Issue' | 'Facility_Conflict' | 'General';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    title: string;
    message: string;
    related_student_id?: number | null;
    related_session_id?: number | null;
    created_by_id?: number | null;
    status: 'Pending' | 'Acknowledged' | 'Resolved';
    created_at?: string;
    resolved_at?: string | null;
}

// Create alerts table if it doesn't exist (we'll add this to schema later)
export const createAlertsTable = async (): Promise<void> => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sports_alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            alert_type ENUM('Missing_Student', 'Equipment_Issue', 'Facility_Conflict', 'General') NOT NULL,
            severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            related_student_id INT,
            related_session_id INT,
            created_by_id INT,
            status ENUM('Pending', 'Acknowledged', 'Resolved') DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP NULL,
            INDEX idx_status (status),
            INDEX idx_type (alert_type),
            INDEX idx_student (related_student_id)
        )
    `);
};

// Alert CRUD
export const createAlert = async (alert: Alert): Promise<number> => {
    const {
        alert_type,
        severity,
        title,
        message,
        related_student_id,
        related_session_id,
        created_by_id,
        status
    } = alert;

    const [result] = await pool.query<OkPacket>(
        `INSERT INTO sports_alerts 
         (alert_type, severity, title, message, related_student_id, related_session_id, created_by_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [alert_type, severity, title, message, related_student_id, related_session_id, created_by_id, status || 'Pending']
    );
    return result.insertId;
};

export const getAlerts = async (filters?: {
    status?: string;
    alert_type?: string;
    severity?: string;
    student_id?: number;
}): Promise<Alert[]> => {
    let query = 'SELECT * FROM sports_alerts WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
        query += ' AND status = ?';
        params.push(filters.status);
    }

    if (filters?.alert_type) {
        query += ' AND alert_type = ?';
        params.push(filters.alert_type);
    }

    if (filters?.severity) {
        query += ' AND severity = ?';
        params.push(filters.severity);
    }

    if (filters?.student_id) {
        query += ' AND related_student_id = ?';
        params.push(filters.student_id);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Alert[];
};

export const getAlertById = async (id: number): Promise<Alert | null> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM sports_alerts WHERE id = ?',
        [id]
    );
    return rows.length > 0 ? (rows[0] as Alert) : null;
};

export const updateAlertStatus = async (id: number, status: 'Acknowledged' | 'Resolved'): Promise<void> => {
    const resolvedAt = status === 'Resolved' ? 'NOW()' : 'NULL';
    await pool.query(
        `UPDATE sports_alerts SET status = ?, resolved_at = ${resolvedAt} WHERE id = ?`,
        [status, id]
    );
};

export const deleteAlert = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM sports_alerts WHERE id = ?', [id]);
};

// Automatic Alert Generation for Missing Students
export const checkMissingStudents = async (sessionId: number): Promise<number> => {
    // Get all students registered for the activity of this session
    const [registeredStudents] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT sm.student_id, sm.activity_id, ps.coach_id
         FROM sports_memberships sm
         INNER JOIN sports_practice_sessions ps ON sm.activity_id = ps.activity_id
         WHERE ps.id = ? AND sm.quit_at IS NULL`,
        [sessionId]
    );

    // Get students who were marked present or late (acceptable statuses)
    const [attendedStudents] = await pool.query<RowDataPacket[]>(
        `SELECT student_id 
         FROM sports_attendance 
         WHERE session_id = ? AND status IN ('Present', 'Late', 'Excused')`,
        [sessionId]
    );

    const attendedIds = new Set(attendedStudents.map((s: any) => s.student_id));
    const missingStudents = registeredStudents.filter((s: any) => !attendedIds.has(s.student_id));

    // Create alerts for missing students
    let alertCount = 0;
    for (const student of missingStudents) {
        await createAlert({
            alert_type: 'Missing_Student',
            severity: 'High',
            title: `Student ${student.student_id} missed practice`,
            message: `Student ID ${student.student_id} was registered for this practice session but did not attend.`,
            related_student_id: student.student_id,
            related_session_id: sessionId,
            created_by_id: student.coach_id,
            status: 'Pending'
        });
        alertCount++;
    }

    return alertCount;
};

// Get alert statistics
export interface AlertStats {
    total_alerts: number;
    pending: number;
    acknowledged: number;
    resolved: number;
    by_type: {
        missing_student: number;
        equipment_issue: number;
        facility_conflict: number;
        general: number;
    };
    by_severity: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
}

export const getAlertStatistics = async (): Promise<AlertStats> => {
    const [stats] = await pool.query<RowDataPacket[]>(`
        SELECT 
            COUNT(*) as total_alerts,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'Acknowledged' THEN 1 ELSE 0 END) as acknowledged,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN alert_type = 'Missing_Student' THEN 1 ELSE 0 END) as missing_student,
            SUM(CASE WHEN alert_type = 'Equipment_Issue' THEN 1 ELSE 0 END) as equipment_issue,
            SUM(CASE WHEN alert_type = 'Facility_Conflict' THEN 1 ELSE 0 END) as facility_conflict,
            SUM(CASE WHEN alert_type = 'General' THEN 1 ELSE 0 END) as general,
            SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low,
            SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium,
            SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high,
            SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical
        FROM sports_alerts
    `);

    const row = stats[0] || {};

    return {
        total_alerts: row.total_alerts || 0,
        pending: row.pending || 0,
        acknowledged: row.acknowledged || 0,
        resolved: row.resolved || 0,
        by_type: {
            missing_student: row.missing_student || 0,
            equipment_issue: row.equipment_issue || 0,
            facility_conflict: row.facility_conflict || 0,
            general: row.general || 0
        },
        by_severity: {
            low: row.low || 0,
            medium: row.medium || 0,
            high: row.high || 0,
            critical: row.critical || 0
        }
    };
};
