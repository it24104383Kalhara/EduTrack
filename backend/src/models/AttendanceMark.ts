// ============================================================================
// ATTENDANCE MARK MODEL
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Database model for attendance marking with tracking
// ============================================================================

import pool from '../config/database';

export interface AttendanceMark {
  id?: number;
  student_id: number;
  student_name: string;
  grade: number;
  section: string;
  status: 'present' | 'absent' | 'late';
  marked_date: string;
  marked_time: string;
  updated_date?: string;
  updated_time?: string;
  marked_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

// ============================================================================
// ATTENDANCE MARK MODEL CLASS
// ============================================================================
// Handles all database operations for attendance marking
// ============================================================================

export class AttendanceMarkModel {
  
  // ============================================================================
  // CREATE ATTENDANCE MARK TABLE
  // ============================================================================
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS attendance_mark (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        grade INT NOT NULL,
        section VARCHAR(10) NOT NULL,
        status ENUM('present', 'absent', 'late') NOT NULL,
        marked_date DATE NOT NULL,
        marked_time TIME NOT NULL,
        updated_date DATE DEFAULT NULL,
        updated_time TIME DEFAULT NULL,
        marked_by VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_attendance (student_id, marked_date),
        INDEX idx_student_id (student_id),
        INDEX idx_grade_section (grade, section),
        INDEX idx_marked_date (marked_date),
        INDEX idx_status (status),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `;
    
    try {
      await pool.execute(query);
      console.log('AttendanceMark table created or already exists');
    } catch (error) {
      console.error('Error creating attendance_mark table:', error);
      throw error;
    }
  }

  // ============================================================================
  // MARK ATTENDANCE
  // ============================================================================
  static async markAttendance(attendanceData: Omit<AttendanceMark, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceMark> {
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA'); // Uses local timezone, format: YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const query = `
      INSERT INTO attendance_mark (
        student_id, student_name, grade, section, status, 
        marked_date, marked_time, marked_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        updated_date = ?,
        updated_time = ?,
        marked_by = VALUES(marked_by),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    try {
      await pool.execute(query, [
        attendanceData.student_id,
        attendanceData.student_name,
        attendanceData.grade,
        attendanceData.section,
        attendanceData.status,
        attendanceData.marked_date || currentDate,
        attendanceData.marked_time || currentTime,
        attendanceData.marked_by || null,
        currentDate,
        currentTime
      ]);
      
      // Return the created/updated record
      const marked = await this.getAttendanceByStudentAndDate(
        attendanceData.student_id, 
        attendanceData.marked_date || currentDate
      );
      if (!marked) {
        throw new Error('Failed to retrieve attendance mark record');
      }
      return marked;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_MARK_ERROR]:', error);
      throw new Error('Failed to mark attendance');
    }
  }

  // ============================================================================
  // BULK MARK ATTENDANCE
  // ============================================================================
  static async bulkMarkAttendance(attendanceRecords: Omit<AttendanceMark, 'id' | 'created_at' | 'updated_at'>[]): Promise<boolean> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-CA'); // Uses local timezone, format: YYYY-MM-DD
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      
      for (const record of attendanceRecords) {
        const query = `
          INSERT INTO attendance_mark (
            student_id, student_name, grade, section, status, 
            marked_date, marked_time, marked_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            status = VALUES(status),
            updated_date = ?,
            updated_time = ?,
            marked_by = VALUES(marked_by),
            updated_at = CURRENT_TIMESTAMP
        `;
        
        await connection.execute(query, [
          record.student_id,
          record.student_name,
          record.grade,
          record.section,
          record.status,
          record.marked_date || currentDate,
          record.marked_time || currentTime,
          record.marked_by || null,
          currentDate,
          currentTime
        ]);
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('🔴 [ATTENDANCE_BULK_MARK_ERROR]:', error);
      throw new Error('Failed to bulk mark attendance');
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // GET ATTENDANCE BY STUDENT AND DATE
  // ============================================================================
  static async getAttendanceByStudentAndDate(studentId: number, date: string): Promise<AttendanceMark | null> {
    const query = `
      SELECT * FROM attendance_mark 
      WHERE student_id = ? AND marked_date = ?
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
  static async getAttendanceByGradeAndDate(grade: number, section: string, date: string): Promise<AttendanceMark[]> {
    const query = `
      SELECT am.*, s.first_name, s.last_name, s.parent_phone
      FROM attendance_mark am
      INNER JOIN students s ON am.student_id = s.id
      WHERE am.grade = ? AND am.section = ? AND am.marked_date = ?
      ORDER BY s.first_name, s.last_name
    `;
    
    try {
      const [rows] = await pool.execute(query, [grade, section, date]);
      return rows as AttendanceMark[];
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_GRADE_DATE_ERROR]:', error);
      throw new Error('Failed to get attendance by grade and date');
    }
  }

  // ============================================================================
  // GET ALL ATTENDANCE MARKS
  // ============================================================================
  static async getAllAttendance(): Promise<AttendanceMark[]> {
    const query = `
      SELECT am.*, s.first_name, s.last_name, s.parent_phone
      FROM attendance_mark am
      INNER JOIN students s ON am.student_id = s.id
      ORDER BY am.marked_date DESC, am.marked_time DESC, s.first_name, s.last_name
    `;
    
    try {
      const [rows] = await pool.execute(query);
      return rows as AttendanceMark[];
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_ALL_ERROR]:', error);
      throw new Error('Failed to get all attendance marks');
    }
  }

  // ============================================================================
  // GET ATTENDANCE BY DATE RANGE
  // ============================================================================
  static async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceMark[]> {
    const query = `
      SELECT am.*, s.first_name, s.last_name, s.parent_phone
      FROM attendance_mark am
      INNER JOIN students s ON am.student_id = s.id
      WHERE am.marked_date BETWEEN ? AND ?
      ORDER BY am.marked_date DESC, am.grade, am.section, s.first_name, s.last_name
    `;
    
    try {
      const [rows] = await pool.execute(query, [startDate, endDate]);
      return rows as AttendanceMark[];
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_DATE_RANGE_ERROR]:', error);
      throw new Error('Failed to get attendance by date range');
    }
  }

  // ============================================================================
  // GET ATTENDANCE BY STUDENT
  // ============================================================================
  static async getAttendanceByStudent(studentId: number): Promise<AttendanceMark[]> {
    const query = `
      SELECT am.*, s.first_name, s.last_name, s.parent_phone
      FROM attendance_mark am
      INNER JOIN students s ON am.student_id = s.id
      WHERE am.student_id = ?
      ORDER BY am.marked_date DESC, am.marked_time DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows as AttendanceMark[];
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_STUDENT_ERROR]:', error);
      throw new Error('Failed to get attendance by student');
    }
  }

  // ============================================================================
  // UPDATE ATTENDANCE STATUS
  // ============================================================================
  static async updateAttendanceStatus(
    studentId: number, 
    date: string, 
    status: 'present' | 'absent' | 'late',
    markedBy?: string
  ): Promise<AttendanceMark | null> {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const query = `
      UPDATE attendance_mark 
      SET status = ?, updated_date = ?, updated_time = ?, marked_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND marked_date = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [status, currentDate, currentTime, markedBy, studentId, date]);
      
      if ((result as any).affectedRows > 0) {
        return await this.getAttendanceByStudentAndDate(studentId, date);
      }
      return null;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_UPDATE_ERROR]:', error);
      throw new Error('Failed to update attendance status');
    }
  }

  // ============================================================================
  // DELETE ATTENDANCE RECORD
  // ============================================================================
  static async deleteAttendance(studentId: number, date: string): Promise<boolean> {
    const query = `
      DELETE FROM attendance_mark 
      WHERE student_id = ? AND marked_date = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [studentId, date]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_DELETE_ERROR]:', error);
      throw new Error('Failed to delete attendance record');
    }
  }

  // ============================================================================
  // DELETE ATTENDANCE BY GRADE AND DATE
  // ============================================================================
  static async deleteAttendanceByGradeAndDate(grade: number, section: string, date: string): Promise<boolean> {
    const query = `
      DELETE FROM attendance_mark 
      WHERE grade = ? AND section = ? AND marked_date = ?
    `;
    
    try {
      console.log(`🔍 [DELETE_DEBUG] Attempting to delete: grade=${grade}, section=${section}, date=${date}`);
      
      // First check what records exist before deletion
      const checkQuery = `
        SELECT COUNT(*) as count, student_id, marked_date, status 
        FROM attendance_mark 
        WHERE grade = ? AND section = ? AND marked_date = ?
      `;
      const [checkResult] = await pool.execute(checkQuery, [grade, section, date]);
      console.log('🔍 [DELETE_DEBUG] Records before deletion:', (checkResult as any)[0]);
      
      const [result] = await pool.execute(query, [grade, section, date]);
      console.log('🔍 [DELETE_DEBUG] Delete result:', result);
      console.log('🔍 [DELETE_DEBUG] Affected rows:', (result as any).affectedRows);
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('🔴 [ATTENDANCE_DELETE_GRADE_DATE_ERROR]:', error);
      throw new Error('Failed to delete attendance records by grade and date');
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
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        COUNT(*) as totalRecords,
        COUNT(CASE WHEN marked_date = ? THEN 1 END) as todayRecords,
        COUNT(CASE WHEN marked_date = ? AND status = 'present' THEN 1 END) as presentToday,
        COUNT(CASE WHEN marked_date = ? AND status = 'absent' THEN 1 END) as absentToday,
        COUNT(CASE WHEN marked_date = ? AND status = 'late' THEN 1 END) as lateToday
      FROM attendance_mark
    `;
    
    try {
      const [rows] = await pool.execute(query, [today, today, today, today]);
      const stats = rows as any[];
      
      return {
        totalRecords: stats[0].totalRecords || 0,
        todayRecords: stats[0].todayRecords || 0,
        presentToday: stats[0].presentToday || 0,
        absentToday: stats[0].absentToday || 0,
        lateToday: stats[0].lateToday || 0
      };
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_STATISTICS_ERROR]:', error);
      throw new Error('Failed to get attendance statistics');
    }
  }

  // ============================================================================
  // GET ATTENDANCE SUMMARY BY GRADE AND DATE
  // ============================================================================
  static async getAttendanceSummary(grade: number, section: string, date: string): Promise<{
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    attendance_percentage: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        ROUND(
          (COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) * 100.0) / COUNT(*), 
          2
        ) as attendance_percentage
      FROM attendance_mark
      WHERE grade = ? AND section = ? AND marked_date = ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [grade, section, date]);
      const summary = rows as any[];
      return summary[0] || {
        total_students: 0,
        present_count: 0,
        absent_count: 0,
        late_count: 0,
        attendance_percentage: 0
      };
    } catch (error) {
      console.error('🔴 [ATTENDANCE_GET_SUMMARY_ERROR]:', error);
      throw new Error('Failed to get attendance summary');
    }
  }
}

export default AttendanceMarkModel;
