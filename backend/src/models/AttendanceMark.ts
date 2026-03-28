// ============================================================================
// ATTENDANCE MARK MODEL
// ============================================================================
// Version: 1.1.0 | Consolidated Queries
// Author: EduTrack Development Team
// Description: Database model for attendance marking with tracking
// ============================================================================

import pool from '../config/database';
import { ATTENDANCE_MARK_QUERIES } from './DatabaseQueries';

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
  // MARK ATTENDANCE
  // ============================================================================
  static async markAttendance(attendanceData: Omit<AttendanceMark, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceMark> {
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    try {
      await pool.execute(ATTENDANCE_MARK_QUERIES.MARK, [
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
      const currentDate = now.toLocaleDateString('en-CA');
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      
      for (const record of attendanceRecords) {
        await connection.execute(ATTENDANCE_MARK_QUERIES.MARK, [
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
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.FIND_BY_STUDENT_DATE, [studentId, date]);
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
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.FIND_BY_GRADE_DATE, [grade, section, date]);
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
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.FIND_ALL);
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
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.FIND_BY_DATE_RANGE, [startDate, endDate]);
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
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.FIND_BY_STUDENT, [studentId]);
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
    
    try {
      const [result] = await pool.execute(ATTENDANCE_MARK_QUERIES.UPDATE, [status, currentDate, currentTime, markedBy, studentId, date]);
      
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
    try {
      const [result] = await pool.execute(ATTENDANCE_MARK_QUERIES.DELETE, [studentId, date]);
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
    try {
      console.log(`🔍 [DELETE_DEBUG] Attempting to delete: grade=${grade}, section=${section}, date=${date}`);
      
      const [checkResult] = await pool.execute(ATTENDANCE_MARK_QUERIES.CHECK_BEFORE_DELETE, [grade, section, date]);
      console.log('🔍 [DELETE_DEBUG] Records before deletion:', (checkResult as any)[0]);
      
      const [result] = await pool.execute(ATTENDANCE_MARK_QUERIES.DELETE_BY_GRADE_DATE, [grade, section, date]);
      console.log('🔍 [DELETE_DEBUG] Delete result:', result);
      
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
    
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.GET_STATISTICS, [today, today, today, today]);
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
    try {
      const [rows] = await pool.execute(ATTENDANCE_MARK_QUERIES.GET_SUMMARY, [grade, section, date]);
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
