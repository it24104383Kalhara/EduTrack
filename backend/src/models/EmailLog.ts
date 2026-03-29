import pool from '../config/database';
import { EMAIL_LOG_QUERIES } from './DatabaseQueries';

export { pool }; // Export pool for use in routes

export interface EmailLog {
  id?: number;
  mark_id: number;
  student_id: number;
  student_name?: string;
  student_class?: string;
  parent_email: string;
  email_type: 'low_mark_alert';
  status: 'sent' | 'failed';
  error_message?: string;
  failed_subjects_count?: number;
  sent_at?: string;
  created_at?: string;
}

export class EmailLogModel {

  static async create(logData: Omit<EmailLog, 'id' | 'created_at'>): Promise<EmailLog> {
    const values = [
      logData.mark_id,
      logData.student_id,
      logData.student_name ?? null,
      logData.student_class ?? null,
      logData.parent_email,
      logData.email_type,
      logData.status,
      logData.error_message ?? null,
      logData.failed_subjects_count ?? 0,
      logData.sent_at ?? null
    ];

    try {
      const result = await pool.execute(EMAIL_LOG_QUERIES.CREATE, values);
      const insertResult = result as any;

      if (insertResult.insertId && insertResult.insertId > 0) {
        const log = await this.findById(insertResult.insertId);
        if (!log) {
          throw new Error('Failed to retrieve newly created email log');
        }
        return log;
      } else {
        const log = await this.findByMarkId(logData.mark_id);
        if (!log) {
          throw new Error('Failed to retrieve updated email log');
        }
        return log;
      }
    } catch (error) {
      console.error('❌ Error creating email log:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<EmailLog | null> {
    try {
      const [rows] = await pool.execute(EMAIL_LOG_QUERIES.FIND_BY_ID, [id]) as [EmailLog[], any];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error finding email log by ID:', error);
      throw error;
    }
  }

  static async findByMarkId(markId: number): Promise<EmailLog | null> {
    try {
      const [rows] = await pool.execute(EMAIL_LOG_QUERIES.FIND_BY_MARK_ID, [markId]) as [EmailLog[], any];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error finding email log by mark ID:', error);
      throw error;
    }
  }

  static async hasEmailBeenSent(markId: number): Promise<boolean> {
    try {
      const [rows] = await pool.execute(EMAIL_LOG_QUERIES.HAS_EMAIL_BEEN_SENT, [markId]) as [any[], any];
      return rows.length > 0;
    } catch (error) {
      console.error('❌ Error checking if email was sent:', error);
      throw error;
    }
  }

  static async getEmailLogForMark(markId: number): Promise<EmailLog | null> {
    try {
      const [rows] = await pool.execute(EMAIL_LOG_QUERIES.GET_LATEST_FOR_MARK, [markId]) as [EmailLog[], any];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error getting email log for mark:', error);
      throw error;
    }
  }

  static async findByStudentId(studentId: number, limit: number = 50): Promise<EmailLog[]> {
    try {
      const [rows] = await pool.execute(EMAIL_LOG_QUERIES.FIND_BY_STUDENT_ID, [studentId, limit]) as [EmailLog[], any];
      return rows;
    } catch (error) {
      console.error('❌ Error finding email logs by student ID:', error);
      throw error;
    }
  }

  static async findByStatus(status: 'sent' | 'failed', limit: number = 100): Promise<EmailLog[]> {
    try {
      const [rows] = await pool.execute(EMAIL_LOG_QUERIES.FIND_BY_STATUS, [status, limit]) as [EmailLog[], any];
      return rows;
    } catch (error) {
      console.error('❌ Error finding email logs by status:', error);
      throw error;
    }
  }

  static async getEmailStatistics(days: number = 30, teacherId?: number): Promise<{
    total_sent: number;
    total_failed: number;
    success_rate: number;
    total_students: number;
    recent_sent: number;
    recent_failed: number;
  }> {
    try {
      let query = EMAIL_LOG_QUERIES.GET_STATISTICS;
      let params: any[] = [days, days];

      if (teacherId) {
        query = `
          SELECT 
            COUNT(CASE WHEN el.status = 'sent' THEN 1 END) as total_sent,
            COUNT(CASE WHEN el.status = 'failed' THEN 1 END) as total_failed,
            COUNT(CASE WHEN el.status = 'sent' AND el.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 END) as recent_sent,
            COUNT(CASE WHEN el.status = 'failed' AND el.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 END) as recent_failed,
            COUNT(DISTINCT el.student_id) as total_students
          FROM email_logs el
          JOIN marks m ON el.mark_id = m.id
          JOIN grades g ON m.grade_id = g.id
          WHERE g.teacher_id = ?
        `;
        params.push(teacherId);
      }

      const [rows] = await pool.execute(query, params) as [any[], any];
      const row = rows[0] || {};

      const total = (row.total_sent || 0) + (row.total_failed || 0);
      const success_rate = total > 0 ? (row.total_sent / total) * 100 : 0;

      return {
        total_sent: row.total_sent || 0,
        total_failed: row.total_failed || 0,
        success_rate: parseFloat(success_rate.toFixed(2)),
        total_students: row.total_students || 0,
        recent_sent: row.recent_sent || 0,
        recent_failed: row.recent_failed || 0
      };
    } catch (error) {
      console.error('❌ Error getting email statistics:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute(EMAIL_LOG_QUERIES.DELETE, [id]) as [any, any];
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ Error deleting email log:', error);
      throw error;
    }
  }

  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const [result] = await pool.execute(EMAIL_LOG_QUERIES.CLEANUP_OLD, [daysToKeep]) as [any, any];
      return result.affectedRows;
    } catch (error) {
      console.error('❌ Error cleaning up old email logs:', error);
      throw error;
    }
  }
}
