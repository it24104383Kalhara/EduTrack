import pool from '../config/database';
import { STUDENT_SUBJECT_QUERIES } from './DatabaseQueries';

export interface StudentSubject {
  id?: number;
  student_id: number;
  subject_id: string;
  grade_id: number;
  assigned_at?: Date;
  subject_name?: string;
  subject_code?: string;
  category?: string;
  is_optional?: boolean;
}

export class StudentSubjectModel {
  static async assignBulk(assignments: {student_id: number, subject_id: string, grade_id: number}[]): Promise<void> {
    if (assignments.length === 0) return;
    try {
      const values = assignments.map(a => [a.student_id, a.subject_id, a.grade_id]);
      await pool.query(STUDENT_SUBJECT_QUERIES.ASSIGN_BULK, [values]);
    } catch (error) {
      console.error('🔴 [STUDENT_SUBJECT_ASSIGN_BULK_ERROR]:', error);
      throw new Error('Failed to assign subjects to student');
    }
  }

  static async removeForStudent(studentId: number, gradeId: number): Promise<void> {
    try {
      await pool.execute(STUDENT_SUBJECT_QUERIES.REMOVE_FOR_STUDENT, [studentId, gradeId]);
    } catch (error) {
      console.error('🔴 [STUDENT_SUBJECT_REMOVE_ERROR]:', error);
      throw new Error('Failed to remove student subjects');
    }
  }

  static async getByStudentGrade(studentId: number, gradeId: number): Promise<StudentSubject[]> {
    try {
      const [rows] = await pool.execute(STUDENT_SUBJECT_QUERIES.GET_BY_STUDENT_GRADE, [studentId, gradeId]);
      return rows as StudentSubject[];
    } catch (error) {
      console.error('🔴 [STUDENT_SUBJECT_GET_BY_STUDENT_ERROR]:', error);
      throw new Error('Failed to fetch student subjects');
    }
  }

  static async getBySubjectGrade(subjectId: string, gradeId: number): Promise<any[]> {
    try {
      const [rows] = await pool.execute(STUDENT_SUBJECT_QUERIES.GET_BY_SUBJECT_GRADE, [subjectId, gradeId]);
      return rows as any[];
    } catch (error) {
      console.error('🔴 [STUDENT_SUBJECT_GET_BY_SUBJECT_ERROR]:', error);
      throw new Error('Failed to fetch students for subject');
    }
  }

  static async syncStudentsForSubject(subjectId: string, gradeId: number, studentIds: number[]): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 1. Remove all current enrollments for this subject in this grade
      await connection.query('DELETE FROM student_subjects WHERE subject_id = ? AND grade_id = ?', [subjectId, gradeId]);
      
      // 2. Add new enrollments
      if (studentIds.length > 0) {
        const values = studentIds.map(sid => [sid, subjectId, gradeId]);
        await connection.query('INSERT INTO student_subjects (student_id, subject_id, grade_id) VALUES ?', [values]);
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('🔴 [SYNC_STUDENTS_FOR_SUBJECT_ERROR]:', error);
      throw new Error('Failed to sync student subject assignments');
    } finally {
      connection.release();
    }
  }
}
