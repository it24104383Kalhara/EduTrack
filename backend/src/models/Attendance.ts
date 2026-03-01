// ============================================================================
// ATTENDANCE MODEL
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Database model for attendance management with comprehensive tracking
// ============================================================================

import pool from '../config/database';

export interface Attendance {
  id?: number;
  grade_id: number;
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
  grade_id: number;
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

// ============================================================================
// ATTENDANCE MODEL CLASS
// ============================================================================
// Handles all database operations for attendance tracking
// ============================================================================

export class AttendanceModel {
  
  // ============================================================================
  // CREATE ATTENDANCE TABLE
  // ============================================================================
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade_id INT NOT NULL,
        grade INT NOT NULL,
        section VARCHAR(10) NOT NULL,
        student_id INT NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'late') NOT NULL,
        marked_by VARCHAR(100),
        marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_attendance (student_id, date),
        INDEX idx_grade_date (grade_id, date),
        INDEX idx_student_date (student_id, date),
        INDEX idx_date (date),
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `;
    
    try {
      await pool.execute(query);
      console.log('Attendance table created or already exists');
    } catch (error) {
      console.error('Error creating attendance table:', error);
      throw error;
    }
  }

  // ============================================================================
  // MARK ATTENDANCE FOR MULTIPLE STUDENTS
  // ============================================================================
  static async markAttendanceBulk(attendanceRecords: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'marked_at'>[]): Promise<boolean> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const record of attendanceRecords) {
        const query = `
          INSERT INTO attendance (
            grade_id, grade, section, student_id, student_name, date, status, marked_by, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            status = VALUES(status),
            marked_by = VALUES(marked_by),
            notes = VALUES(notes),
            updated_at = CURRENT_TIMESTAMP
        `;
        
        await connection.execute(query, [
          record.grade_id,
          record.grade,
          record.section,
          record.student_id,
          record.student_name,
          record.date,
          record.status,
          record.marked_by || null,
          record.notes || null
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
    const query = `
      INSERT INTO attendance (
        grade_id, grade, section, student_id, student_name, date, status, marked_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        marked_by = VALUES(marked_by),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    try {
      await pool.execute(query, [
        attendanceData.grade_id,
        attendanceData.grade,
        attendanceData.section,
        attendanceData.student_id,
        attendanceData.student_name,
        attendanceData.date,
        attendanceData.status,
        attendanceData.marked_by || null,
        attendanceData.notes || null
      ]);
      
      // Return the created/updated attendance record
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
    const query = `
      SELECT * FROM attendance 
      WHERE student_id = ? AND date = ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [studentId, date]);
      const attendance = rows as any[];
      return attendance.length > 0 ? attendance[0] : null;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_STUDENT_DATE_ERROR]:', error);
      throw new Error('Failed to get attendance by student and date');
    }
  }

  // ============================================================================
  // GET ATTENDANCE BY GRADE AND DATE
  // ============================================================================
  static async getAttendanceByGradeAndDate(gradeId: number, date: string): Promise<Attendance[]> {
    const query = `
      SELECT a.*, s.first_name, s.last_name, s.parent_phone
      FROM attendance a
      INNER JOIN students s ON a.student_id = s.id
      WHERE a.grade_id = ? AND a.date = ?
      ORDER BY s.first_name, s.last_name
    `;
    
    try {
      const [rows] = await pool.execute(query, [gradeId, date]);
      return rows as Attendance[];
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_GRADE_DATE_ERROR]:', error);
      throw new Error('Failed to get attendance by grade and date');
    }
  }

  // ============================================================================
  // GET ATTENDANCE SUMMARY BY GRADE AND DATE
  // ============================================================================
  static async getAttendanceSummary(gradeId: number, date: string): Promise<AttendanceSummary | null> {
    const query = `
      SELECT 
        g.id as grade_id,
        g.grade,
        g.grade_part as section,
        ? as date,
        COUNT(DISTINCT sa.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END) as present_count,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.student_id END) as absent_count,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.student_id END) as late_count,
        COUNT(DISTINCT CASE WHEN a.id IS NULL THEN sa.student_id END) as not_marked_count,
        ROUND(
          (COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.student_id END) * 100.0) / 
          COUNT(DISTINCT sa.student_id), 
          2
        ) as attendance_percentage
      FROM grades g
      LEFT JOIN student_assignment sa ON g.grade = sa.grade AND g.grade_part = sa.section
      LEFT JOIN attendance a ON sa.student_id = a.student_id AND a.date = ?
      WHERE g.id = ?
      GROUP BY g.id, g.grade, g.grade_part
    `;
    
    try {
      const [rows] = await pool.execute(query, [date, date, gradeId]);
      const summaries = rows as any[];
      return summaries.length > 0 ? summaries[0] : null;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_SUMMARY_ERROR]:', error);
      throw new Error('Failed to get attendance summary');
    }
  }

  // ============================================================================
  // GET ATTENDANCE DATES FOR GRADE
  // ============================================================================
  static async getAttendanceDates(gradeId: number): Promise<string[]> {
    const query = `
      SELECT DISTINCT DATE(date) as date
      FROM attendance
      WHERE grade_id = ?
      ORDER BY date DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [gradeId]);
      const dates = rows as any[];
      return dates.map(row => row.date);
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_DATES_ERROR]:', error);
      throw new Error('Failed to get attendance dates');
    }
  }

  // ============================================================================
  // GET STUDENT ATTENDANCE REPORT
  // ============================================================================
  static async getStudentAttendanceReport(studentId: number, startDate?: string, endDate?: string): Promise<AttendanceReport> {
    let dateFilter = '';
    const params: any[] = [studentId];
    
    if (startDate && endDate) {
      dateFilter = 'AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'AND date >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'AND date <= ?';
      params.push(endDate);
    }
    
    const query = `
      SELECT 
        s.id as student_id,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        COUNT(DISTINCT a.date) as total_days,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.date END) as present_days,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.date END) as absent_days,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.date END) as late_days,
        ROUND(
          (COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.date END) * 100.0) / 
          COUNT(DISTINCT a.date), 
          2
        ) as attendance_percentage
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id ${dateFilter}
      WHERE s.id = ?
      GROUP BY s.id, s.first_name, s.last_name
    `;
    
    try {
      const [rows] = await pool.execute(query, params);
      const reports = rows as any[];
      
      if (reports.length === 0) {
        // Return empty report if no attendance found
        const student = await pool.execute('SELECT CONCAT(first_name, " ", last_name) as name FROM students WHERE id = ?', [studentId]);
        const studentData = student as any[];
        return {
          student_id: studentId,
          student_name: studentData[0]?.name || 'Unknown Student',
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
    let dateFilter = '';
    const params: any[] = [gradeId];
    
    if (startDate && endDate) {
      dateFilter = 'AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'AND a.date >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'AND a.date <= ?';
      params.push(endDate);
    }
    
    const query = `
      SELECT 
        s.id as student_id,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        COUNT(DISTINCT a.date) as total_days,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.date END) as present_days,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.date END) as absent_days,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.date END) as late_days,
        ROUND(
          (COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.date END) * 100.0) / 
          COUNT(DISTINCT a.date), 
          2
        ) as attendance_percentage
      FROM student_assignment sa
      INNER JOIN students s ON sa.student_id = s.id
      LEFT JOIN attendance a ON s.id = a.student_id AND sa.grade = a.grade AND sa.section = a.section ${dateFilter}
      WHERE sa.grade = (SELECT grade FROM grades WHERE id = ?)
        AND sa.section = (SELECT grade_part FROM grades WHERE id = ?)
      GROUP BY s.id, s.first_name, s.last_name
      ORDER BY s.first_name, s.last_name
    `;
    
    // Add gradeId twice for grade and section subqueries
    params.push(gradeId, gradeId);
    
    try {
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
    const query = `
      DELETE FROM attendance 
      WHERE grade_id = ? AND date = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [gradeId, date]);
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
    const today = new Date().toLocaleDateString('en-CA'); // Uses local timezone, format: YYYY-MM-DD
    
    const query = `
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(CASE WHEN date = ? THEN 1 END) as todayRecords,
        COUNT(CASE WHEN date = ? AND status = 'present' THEN 1 END) as presentToday,
        COUNT(CASE WHEN date = ? AND status = 'absent' THEN 1 END) as absentToday,
        COUNT(CASE WHEN date = ? AND status = 'late' THEN 1 END) as lateToday,
        ROUND(
          AVG(
            CASE 
              WHEN date = ? THEN 
                CASE WHEN status IN ('present', 'late') THEN 100 ELSE 0 END
              ELSE NULL 
            END
          ), 
          2
        ) as averageAttendance
      FROM attendance
    `;
    
    try {
      const [rows] = await pool.execute(query, [today, today, today, today, today]);
      const stats = rows as any[];
      
      return {
        totalRecords: stats[0].totalRecords || 0,
        todayRecords: stats[0].todayRecords || 0,
        presentToday: stats[0].presentToday || 0,
        absentToday: stats[0].absentToday || 0,
        lateToday: stats[0].lateToday || 0,
        averageAttendance: stats[0].averageAttendance || 0
      };
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_STATISTICS_ERROR]:', error);
      throw new Error('Failed to get attendance statistics');
    }
  }
}

export default AttendanceModel;
