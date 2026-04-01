// ============================================================================
// ATTENDANCE MODEL
// ============================================================================
// Version: 1.2.0 | Refactored to use attendance_mark table
// Author: EduTrack Development Team
// Description: Database model for attendance management using attendance_mark table
// ============================================================================

import pool from '../config/database';
import { ATTENDANCE_MARK_QUERIES } from './DatabaseQueries';

export interface Attendance {
  id?: number;
  grade_id?: number; // Kept for compatibility with old interface
  grade: number;
  section: string;
  student_id: number;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  marked_by?: string;
  marked_at?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AttendanceSummary {
  grade_id?: number;
  grade: number;
  section: string;
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  not_marked_count: number;
  attendance_percentage: number;
}

export interface AttendanceReport {
  student_id: number;
  student_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: number;
}

/**
 * ATTENDANCE MODEL CLASS
 * Refactored to use attendance_mark table as the single source of truth for attendance.
 */
export class AttendanceModel {

  /**
   * Helper to get current date/time for marking
   */
  private static getCurrentTimeInfo() {
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    return { currentDate, currentTime };
  }

  // ============================================================================
  // MARK ATTENDANCE FOR MULTIPLE STUDENTS
  // ============================================================================
  static async markAttendanceBulk(attendanceRecords: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'marked_at'>[]): Promise<boolean> {
    const connection = await pool.getConnection();
    const { currentDate, currentTime } = this.getCurrentTimeInfo();

    try {
      await connection.beginTransaction();

      for (const record of attendanceRecords) {
        await connection.execute(ATTENDANCE_MARK_QUERIES.MARK, [
          record.student_id,
          record.student_name,
          record.grade,
          record.section,
          record.status,
          record.date, // marked_date
          currentTime, // marked_time
          record.marked_by || null,
          currentDate, // updated_date
          currentTime  // updated_time
        ]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('🔴 [ATTENDANCE_BULK_MARK_ERROR]:', error);
      throw new Error('Failed to mark attendance bulk');
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // MARK ATTENDANCE FOR SINGLE STUDENT
  // ============================================================================
  static async markAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'marked_at'>): Promise<Attendance> {
    const { currentDate, currentTime } = this.getCurrentTimeInfo();
    try {
      await pool.execute(ATTENDANCE_MARK_QUERIES.MARK, [
        attendanceData.student_id,
        attendanceData.student_name,
        attendanceData.grade,
        attendanceData.section,
        attendanceData.status,
        attendanceData.date, // marked_date
        currentTime, // marked_time
        attendanceData.marked_by || null,
        currentDate, // updated_date
        currentTime  // updated_time
      ]);

      const attendance = await this.getAttendanceByStudentAndDate(
        attendanceData.student_id,
        attendanceData.date
      );
      if (!attendance) {
        throw new Error('Failed to retrieve attendance record');
      }
      return attendance;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_MARK_ERROR]:', error);
      throw new Error('Failed to mark attendance');
    }
  }

  // ============================================================================
  // GET ATTENDANCE BY STUDENT AND DATE
  // ============================================================================
  static async getAttendanceByStudentAndDate(studentId: number, date: string): Promise<Attendance | null> {
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.FIND_BY_STUDENT_DATE, [studentId, date]);
      const attendance = rows as any[];
      if (attendance.length === 0) return null;

      const row = attendance[0];
      return {
        id: row.id,
        student_id: row.student_id,
        student_name: row.student_name,
        grade: row.grade,
        section: row.section,
        status: row.status,
        date: row.marked_date,
        marked_by: row.marked_by,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_STUDENT_DATE_ERROR]:', error);
      throw new Error('Failed to get attendance by student and date');
    }
  }

  // ============================================================================
  // GET ATTENDANCE BY GRADE AND DATE
  // ============================================================================
  static async getAttendanceByGradeAndDate(gradeId: number, date: string): Promise<Attendance[]> {
    try {
      // Resolve gradeId to grade & section
      const [gradeRows] = await pool.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [gradeId]);
      const grades = gradeRows as any[];
      if (grades.length === 0) return [];

      const { grade, grade_part } = grades[0];

      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.FIND_BY_GRADE_DATE, [grade, grade_part, date]);
      return (rows as any[]).map(row => ({
        id: row.id,
        student_id: row.student_id,
        student_name: row.student_name,
        grade: row.grade,
        section: row.section,
        status: row.status,
        date: row.marked_date,
        marked_by: row.marked_by,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_GRADE_DATE_ERROR]:', error);
      throw new Error('Failed to get attendance by grade and date');
    }
  }

  // ============================================================================
  // GET ATTENDANCE SUMMARY BY GRADE AND DATE
  // ============================================================================
  static async getAttendanceSummary(gradeId: number, date: string): Promise<AttendanceSummary | null> {
    try {
      // Resolve gradeId to grade & section
      const [gradeRows] = await pool.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [gradeId]);
      const grades = gradeRows as any[];
      if (grades.length === 0) return null;

      const { grade, grade_part } = grades[0];

      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.GET_SUMMARY, [grade, grade_part, date]);
      const summaries = rows as any[];
      if (summaries.length === 0) return null;

      const summary = summaries[0];
      return {
        grade_id: gradeId,
        grade: grade,
        section: grade_part,
        date: date,
        total_students: summary.total_students,
        present_count: summary.present_count,
        absent_count: summary.absent_count,
        late_count: summary.late_count,
        not_marked_count: summary.total_students - (summary.present_count + summary.absent_count + summary.late_count),
        attendance_percentage: parseFloat(summary.attendance_percentage)
      };
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_SUMMARY_ERROR]:', error);
      throw new Error('Failed to get attendance summary');
    }
  }

  // ============================================================================
  // GET ATTENDANCE DATES FOR GRADE
  // ============================================================================
  static async getAttendanceDates(gradeId: number): Promise<string[]> {
    try {
      const [gradeRows] = await pool.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [gradeId]);
      const grades = gradeRows as any[];
      if (grades.length === 0) return [];

      const { grade, grade_part } = grades[0];

      // We don't have a direct query for this in ATTENDANCE_MARK_QUERIES but we can easily query
      const [rows] = await pool.execute(
        'SELECT DISTINCT marked_date as date FROM attendance_mark WHERE grade = ? AND section = ? ORDER BY marked_date DESC',
        [grade, grade_part]
      );
      const dates = rows as any[];
      return dates.map(row => row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date);
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_DATES_ERROR]:', error);
      throw new Error('Failed to get attendance dates');
    }
  }

  // ============================================================================
  // GET STUDENT ATTENDANCE REPORT
  // ============================================================================
  static async getStudentAttendanceReport(studentId: number, startDate?: string, endDate?: string): Promise<AttendanceReport> {
    try {
      let query = `
        SELECT 
          student_id,
          student_name,
          COUNT(*) as total_days,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
          ROUND((COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
        FROM attendance_mark
        WHERE student_id = ?
      `;
      const params: any[] = [studentId];

      if (startDate && endDate) {
        query += ' AND marked_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' AND marked_date >= ?';
        params.push(startDate);
      } else if (endDate) {
        query += ' AND marked_date <= ?';
        params.push(endDate);
      }

      query += ' GROUP BY student_id, student_name';

      const [rows] = await pool.execute(query, params);
      const reports = rows as any[];

      if (reports.length === 0) {
        // Fetch student name if no records found
        const [studentRows] = await pool.execute('SELECT first_name, last_name FROM students WHERE id = ?', [studentId]);
        const students = studentRows as any[];
        return {
          student_id: studentId,
          student_name: students.length > 0 ? `${students[0].first_name} ${students[0].last_name}` : 'Unknown Student',
          total_days: 0,
          present_days: 0,
          absent_days: 0,
          late_days: 0,
          attendance_percentage: 0
        };
      }

      return reports[0];
    } catch (error) {
      console.error('🔴 [ATTENDANCE_STUDENT_REPORT_ERROR]:', error);
      throw new Error('Failed to get student attendance report');
    }
  }

  // ============================================================================
  // GET GRADE ATTENDANCE REPORT
  // ============================================================================
  static async getGradeAttendanceReport(gradeId: number, startDate?: string, endDate?: string): Promise<AttendanceReport[]> {
    try {
      const [gradeRows] = await pool.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [gradeId]);
      const grades = gradeRows as any[];
      if (grades.length === 0) return [];

      const { grade, grade_part } = grades[0];

      let query = `
        SELECT 
          student_id,
          student_name,
          COUNT(*) as total_days,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
          ROUND((COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
        FROM attendance_mark
        WHERE grade = ? AND section = ?
      `;
      const params: any[] = [grade, grade_part];

      if (startDate && endDate) {
        query += ' AND marked_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' GROUP BY student_id, student_name ORDER BY student_name ASC';

      const [rows] = await pool.execute(query, params);
      return rows as AttendanceReport[];
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GRADE_REPORT_ERROR]:', error);
      throw new Error('Failed to get grade attendance report');
    }
  }

  // ============================================================================
  // DELETE ATTENDANCE RECORDS
  // ============================================================================
  static async deleteAttendance(gradeId: number, date: string): Promise<boolean> {
    try {
      const [gradeRows] = await pool.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [gradeId]);
      const grades = gradeRows as any[];
      if (grades.length === 0) return false;

      const { grade, grade_part } = grades[0];

      const [result] = await pool.execute(ATTENDANCE_MARK_QUERIES.DELETE_BY_GRADE_DATE, [grade, grade_part, date]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_DELETE_ERROR]:', error);
      throw new Error('Failed to delete attendance records');
    }
  }

  // ============================================================================
  // GET ATTENDANCE STATISTICS
  // ============================================================================
  static async getStatistics(): Promise<{
    totalRecords: number;
    todayRecords: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    averageAttendance: number;
  }> {
    const today = new Date().toLocaleDateString('en-CA');

    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.GET_STATISTICS, [today, today, today, today]);
      const stats = rows as any[];

      // Total historical students count for relative percentage calculation
      const [totalStudentsResult] = await pool.execute('SELECT COUNT(*) as count FROM students');
      const totalStudents = (totalStudentsResult as any[])[0].count || 1;

      const presentToday = stats[0].presentToday || 0;
      const lateToday = stats[0].lateToday || 0;
      const todayTotalMarked = stats[0].todayRecords || 1;

      return {
        totalRecords: stats[0].totalRecords || 0,
        todayRecords: stats[0].todayRecords || 0,
        presentToday: presentToday,
        absentToday: stats[0].absentToday || 0,
        lateToday: lateToday,
        averageAttendance: parseFloat(stats[0].averageAttendance) || 0
      };
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_STATISTICS_ERROR]:', error);
      throw new Error('Failed to get attendance statistics');
    }
  }

  // ============================================================================
  // GET WEEKLY ATTENDANCE TRENDS
  // ============================================================================
  static async getWeeklyAttendanceTrends(teacherId?: number): Promise<any[]> {
    try {
      let query = '';
      let params: any[] = [];

      if (teacherId) {
        query = `
          SELECT 
            g.id as grade_id,
            CONCAT(g.grade, '-', g.grade_part) as grade_name,
            DATE_FORMAT(am.marked_date, '%a') as day,
            ROUND(
              (COUNT(DISTINCT CASE WHEN am.status IN ('present', 'late') THEN am.student_id END) * 100.0) / 
              NULLIF(enrollment.total, 0), 2
            ) as attendance_percentage,
            am.marked_date as date
          FROM attendance_mark am
          JOIN grades g ON am.grade = g.grade AND am.section = g.grade_part
          JOIN (
            SELECT grade_id, COUNT(*) as total FROM student_assignment GROUP BY grade_id
          ) enrollment ON g.id = enrollment.grade_id
          WHERE g.teacher_id = ? AND am.marked_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          GROUP BY g.id, g.grade, g.grade_part, enrollment.total, am.marked_date 
          ORDER BY am.marked_date ASC
        `;
        params = [teacherId];
      } else {
        query = `
          SELECT 
            DATE_FORMAT(marked_date, '%a') as day,
            ROUND(
              (COUNT(DISTINCT CASE WHEN status IN ('present', 'late') THEN student_id END) * 100.0) / 
              NULLIF((SELECT COUNT(*) FROM student_assignment), 0), 
              2
            ) as attendance_percentage,
            marked_date as date
          FROM attendance_mark
          WHERE marked_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          GROUP BY marked_date ORDER BY marked_date ASC LIMIT 14
        `;
      }

      const [rows] = await pool.execute(query, params);
      return (rows as any[]).map(row => ({
        grade_id: row.grade_id || null,
        grade_name: row.grade_name || 'System Overall',
        day: row.day,
        attendance_percentage: parseFloat(row.attendance_percentage || 0),
        date: row.date ? (row.date instanceof Date ?
          `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}-${String(row.date.getDate()).padStart(2, '0')}` :
          row.date.toString().split('T')[0]) : ''
      }));
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_WEEKLY_TRENDS_ERROR]:', error);
      throw new Error('Failed to get weekly attendance trends');
    }
  }
}

export default AttendanceModel;
