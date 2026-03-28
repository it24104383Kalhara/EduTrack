// ============================================================================
// GRADE MODEL
// ============================================================================
// Version: 1.1.0 | Consolidated Queries
// Author: EduTrack Development Team
// Description: Database model for grade management with student assignments
// ============================================================================

import pool from '../config/database';
import { GRADE_QUERIES } from './DatabaseQueries';

export interface Grade {
  id?: number;
  grade: number;
  grade_part: string;
  teacher_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  religion: string;
  ethnicity: string;
  address: string;
  nationality: string;
  parent_type: 'father' | 'mother' | 'guardian';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_gender: 'male' | 'female';
  parent_email?: string;
  parent_religion: string;
  parent_ethnicity: string;
  parent_nationality: string;
  created_at?: Date;
}

export interface GradeWithStudents extends Grade {
  students?: Student[];
}

// ============================================================================
// GRADE MODEL CLASS
// ============================================================================
// Handles all database operations for grades and student assignments
// ============================================================================

export class GradeModel {

  // ============================================================================
  // FIND ALL GRADES WITH STUDENTS
  // ============================================================================
  static async findAll(): Promise<GradeWithStudents[]> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.FIND_ALL);
      const grades = rows as any[];

      return grades.map(grade => ({
        ...grade,
        students: grade.students && grade.students.length > 0 ? grade.students : []
      }));
    } catch (error) {
      console.error('🔴 [GRADE_FIND_ALL_ERROR]:', error);
      throw new Error('Failed to fetch all grades');
    }
  }

  // ============================================================================
  // FIND GRADE BY ID WITH STUDENTS
  // ============================================================================
  static async findById(id: number): Promise<GradeWithStudents | null> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.FIND_BY_ID, [id]);
      const grades = rows as any[];

      if (grades.length === 0) return null;

      const grade = grades[0];
      return {
        ...grade,
        students: grade.students && grade.students.length > 0 ? grade.students : []
      };
    } catch (error) {
      console.error('🔴 [GRADE_FIND_BY_ID_ERROR]:', error);
      throw new Error('Failed to fetch grade by ID');
    }
  }

  // ============================================================================
  // GET ALL STUDENT ASSIGNMENTS WITH DETAILS
  // ============================================================================
  static async getAllStudentAssignments(): Promise<any[]> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.GET_ALL_ASSIGNMENTS);
      return rows as any[];
    } catch (error: any) {
      console.error('🔴 [GET_ALL_ASSIGNMENTS_ERROR]:', error.message || error);
      throw new Error(`Failed to fetch student assignments: ${error.message || 'Unknown error'}`);
    }
  }

  // ============================================================================
  // GET STUDENT ASSIGNMENTS BY GRADE ID
  // ============================================================================
  static async getStudentAssignmentsByGrade(gradeId: number): Promise<any[]> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.GET_ASSIGNMENTS_BY_GRADE, [gradeId]);
      return rows as any[];
    } catch (error) {
      console.error('🔴 [GET_ASSIGNMENTS_BY_GRADE_ERROR]:', error);
      throw new Error('Failed to fetch student assignments for grade');
    }
  }

  // ============================================================================
  // FIND GRADE BY GRADE AND PART
  // ============================================================================
  static async findByGradeAndPart(gradeNumber: number, gradePart: string): Promise<GradeWithStudents | null> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.FIND_BY_GRADE_AND_PART, [gradeNumber, gradePart]);
      const grades = rows as any[];

      if (grades.length === 0) return null;

      const grade = grades[0];
      return {
        ...grade,
        students: grade.students && grade.students.length > 0 ? grade.students : []
      };
    } catch (error) {
      console.error('🔴 [GRADE_FIND_BY_GRADE_PART_ERROR]:', error);
      throw new Error('Failed to find grade by grade and part');
    }
  }

  // ============================================================================
  // CREATE NEW GRADE
  // ============================================================================
  static async create(gradeData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade> {
    try {
      const [result] = await pool.execute(GRADE_QUERIES.CREATE, [
        gradeData.grade, 
        gradeData.grade_part, 
        gradeData.teacher_id || null
      ]);
      const insertedId = (result as any).insertId;

      const createdGrade = await this.findById(insertedId);
      if (!createdGrade) {
        throw new Error('Failed to retrieve created grade');
      }
      return createdGrade;
    } catch (error) {
      console.error('🔴 [GRADE_CREATE_ERROR]:', error);
      throw new Error('Failed to create grade');
    }
  }

  // ============================================================================
  // UPDATE GRADE
  // ============================================================================
  static async update(id: number, updateData: Partial<Grade>): Promise<GradeWithStudents | null> {
    const fields = Object.keys(updateData).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    if (fields.length === 0) return null;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current grade data before update
      const [currentGradeRows] = await connection.execute(GRADE_QUERIES.FIND_CURRENT_BEFORE_UPDATE, [id]);
      const currentGrade = (currentGradeRows as any[])[0];

      if (!currentGrade) {
        throw new Error('Grade not found');
      }

      // Update grade record
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => (updateData as any)[field]);
      values.push(id);

      await connection.execute(GRADE_QUERIES.UPDATE(setClause), values);

      // Check if grade or grade_part is being updated
      const isGradeUpdated = updateData.grade !== undefined && updateData.grade !== currentGrade.grade;
      const isSectionUpdated = updateData.grade_part !== undefined && updateData.grade_part !== currentGrade.grade_part;

      if (isGradeUpdated || isSectionUpdated) {
        // Update student assignments to reflect new grade/section
        const newGrade = updateData.grade !== undefined ? updateData.grade : currentGrade.grade;
        const newSection = updateData.grade_part !== undefined ? updateData.grade_part : currentGrade.grade_part;

        await connection.execute(GRADE_QUERIES.UPDATE_ASSIGNMENTS, [
          newGrade, newSection,
          currentGrade.grade, currentGrade.grade_part
        ]);
      }

      await connection.commit();
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      console.error('🔴 [GRADE_UPDATE_ERROR]:', error);
      throw new Error('Failed to update grade');
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // DELETE GRADE
  // ============================================================================
  static async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // First, remove all student assignments for this grade
      await connection.execute(GRADE_QUERIES.DELETE_ASSIGNMENTS_FOR_GRADE, [id]);

      // Then, delete the grade
      const [result] = await connection.execute(GRADE_QUERIES.DELETE, [id]);

      await connection.commit();
      return (result as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('🔴 [GRADE_DELETE_ERROR]:', error);
      throw new Error('Failed to delete grade');
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // CLEAR ALL GRADES
  // ============================================================================
  static async clearAll(): Promise<number> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(GRADE_QUERIES.CLEAR_ALL_ASSIGNMENTS);
      const [result] = await connection.execute(GRADE_QUERIES.CLEAR_ALL_GRADES);

      await connection.commit();
      return (result as any).affectedRows;
    } catch (error) {
      await connection.rollback();
      console.error('🔴 [GRADE_CLEAR_ALL_ERROR]:', error);
      throw new Error('Failed to clear all grades');
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // ASSIGN STUDENT TO GRADE
  // ============================================================================
  static async assignStudent(gradeId: number, studentId: number): Promise<boolean> {
    try {
      await pool.execute(GRADE_QUERIES.ASSIGN_STUDENT, [gradeId, studentId, gradeId]);
      return true;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return false;
      }
      console.error('🔴 [GRADE_ASSIGN_STUDENT_ERROR]:', error);
      throw new Error('Failed to assign student to grade');
    }
  }

  // ============================================================================
  // REMOVE STUDENT FROM GRADE
  // ============================================================================
  static async removeStudent(gradeId: number, studentId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute(GRADE_QUERIES.REMOVE_STUDENT, [gradeId, studentId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('🔴 [GRADE_REMOVE_STUDENT_ERROR]:', error);
      throw new Error('Failed to remove student from grade');
    }
  }

  // ============================================================================
  // CHECK IF STUDENT IS ASSIGNED TO ANY GRADE
  // ============================================================================
  static async isStudentAssigned(studentId: number): Promise<{ assigned: boolean; gradeId?: number }> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.IS_STUDENT_ASSIGNED, [studentId]);
      const assignments = rows as any[];

      if (assignments.length > 0) {
        return { assigned: true, gradeId: assignments[0].grade_id };
      }
      return { assigned: false };
    } catch (error) {
      console.error('🔴 [GRADE_CHECK_STUDENT_ASSIGNED_ERROR]:', error);
      throw new Error('Failed to check if student is assigned');
    }
  }

  // ============================================================================
  // FIND GRADES BY TEACHER ID
  // ============================================================================
  static async findByTeacherId(teacherId: number): Promise<GradeWithStudents[]> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.FIND_BY_TEACHER, [teacherId]);
      const grades = rows as any[];

      return grades.map(grade => ({
        ...grade,
        students: grade.students && grade.students.length > 0 ? grade.students : []
      }));
    } catch (error) {
      console.error('🔴 [GRADE_FIND_BY_TEACHER_ERROR]:', error);
      throw new Error('Failed to fetch grades for teacher');
    }
  }

  // ============================================================================
  // GET GRADE STATISTICS
  // ============================================================================
  static async getStatistics(): Promise<{
    totalGrades: number;
    totalAssignedStudents: number;
    gradesWithStudents: number;
  }> {
    try {
      const [rows] = await pool.execute(GRADE_QUERIES.GET_STATISTICS);
      const stats = rows as any[];

      return {
        totalGrades: stats[0].totalGrades || 0,
        totalAssignedStudents: stats[0].totalAssignedStudents || 0,
        gradesWithStudents: stats[0].gradesWithStudents || 0
      };
    } catch (error) {
      console.error('🔴 [GRADE_GET_STATISTICS_ERROR]:', error);
      throw new Error('Failed to get grade statistics');
    }
  }
  // ============================================================================
  // TRANSFER STUDENT RECORDS (MARKS & ATTENDANCE)
  // ============================================================================
  static async transferRecords(studentId: number, oldGradeId: number, newGradeId: number): Promise<boolean> {
    console.log(`🔵 [TRANSFER_START]: Student ${studentId} from Grade ${oldGradeId} to ${newGradeId}`);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get grade details for both
      const [oldGradeRows] = await connection.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [oldGradeId]);
      const [newGradeRows] = await connection.execute('SELECT grade, grade_part FROM grades WHERE id = ?', [newGradeId]);

      if ((oldGradeRows as any[]).length === 0 || (newGradeRows as any[]).length === 0) {
        console.error('🔴 [TRANSFER_ERROR]: Grade ID not found', { oldGradeId, newGradeId });
        throw new Error('Could not find existing or destination grade information');
      }

      const oldGrade = (oldGradeRows as any[])[0];
      const newGrade = (newGradeRows as any[])[0];
      console.log(`📦 [TRANSFER_DETAILS]: Moving from ${oldGrade.grade}-${oldGrade.grade_part} to ${newGrade.grade}-${newGrade.grade_part}`);

      // 1. Transfer Marks
      const [markResult] = await connection.execute(GRADE_QUERIES.TRANSFER_STUDENT_MARKS, [newGradeId, studentId, oldGradeId]);
      console.log(`✅ [TRANSFER_MARKS]: Affected rows: ${(markResult as any).affectedRows}`);

      // 2. Transfer Attendance Mark
      const [attMarkResult] = await connection.execute(GRADE_QUERIES.TRANSFER_STUDENT_ATTENDANCE_MARK, [
        newGrade.grade, newGrade.grade_part, studentId, oldGrade.grade, oldGrade.grade_part
      ]);
      console.log(`✅ [TRANSFER_ATTENDANCE_MARK]: Affected rows: ${(attMarkResult as any).affectedRows}`);

      await connection.commit();
      console.log(`🏁 [TRANSFER_COMPLETE]: Student ${studentId} history moved successfully.`);
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('🔴 [GRADE_TRANSFER_RECORDS_ERROR]:', error);
      throw new Error('Failed to transfer student academic records');
    } finally {
      connection.release();
    }
  }
}

export default GradeModel;
