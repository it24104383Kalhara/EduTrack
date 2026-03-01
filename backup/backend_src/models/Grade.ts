// ============================================================================
// GRADE MODEL
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Database model for grade management with student assignments
// ============================================================================

import pool from '../config/database';

export interface Grade {
  id?: number;
  grade: number;
  grade_part: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  religion: string;
  ethnicity: string;
  address: string;
  nationality: string;
  parent_type: 'father' | 'mother' | 'guardian';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_gender: 'male' | 'female' | 'other';
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
  // CREATE GRADES TABLE
  // ============================================================================
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade INT NOT NULL,
        grade_part VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_grade (grade, grade_part)
      )
    `;
    
    try {
      await pool.execute(query);
      console.log('Grades table created or already exists');
    } catch (error) {
      console.error('Error creating grades table:', error);
      throw error;
    }
  }

  // ============================================================================
  // CREATE STUDENT ASSIGNMENTS TABLE
  // ============================================================================
  static async createAssignmentsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS student_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade_id INT NOT NULL,
        student_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (grade_id, student_id)
      )
    `;
    
    try {
      await pool.execute(query);
      console.log('Student assignments table created or already exists');
    } catch (error) {
      console.error('Error creating student assignments table:', error);
      throw error;
    }
  }

  // ============================================================================
  // FIND ALL GRADES WITH STUDENTS
  // ============================================================================
  static async findAll(): Promise<GradeWithStudents[]> {
    const query = `
      SELECT 
        g.id,
        g.grade,
        g.grade_part,
        g.created_at,
        g.updated_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', s.id,
            'first_name', s.first_name,
            'last_name', s.last_name,
            'parent_phone', s.parent_phone,
            'assigned_at', sa.assigned_at
          )
        ) as students
      FROM grades g
      LEFT JOIN student_assignments sa ON g.id = sa.grade_id
      LEFT JOIN students s ON sa.student_id = s.id
      GROUP BY g.id, g.grade, g.grade_part, g.created_at, g.updated_at
      ORDER BY g.grade, g.grade_part
    `;
    
    try {
      const [rows] = await pool.execute(query);
      const grades = rows as any[];
      
      return grades.map(grade => ({
        ...grade,
        students: grade.students[0]?.id ? grade.students : []
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
    const query = `
      SELECT 
        g.id,
        g.grade,
        g.grade_part,
        g.created_at,
        g.updated_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', s.id,
            'first_name', s.first_name,
            'last_name', s.last_name,
            'parent_phone', s.parent_phone,
            'assigned_at', sa.assigned_at
          )
        ) as students
      FROM grades g
      LEFT JOIN student_assignments sa ON g.id = sa.grade_id
      LEFT JOIN students s ON sa.student_id = s.id
      WHERE g.id = ?
      GROUP BY g.id, g.grade, g.grade_part, g.created_at, g.updated_at
    `;
    
    try {
      const [rows] = await pool.execute(query, [id]);
      const grades = rows as any[];
      
      if (grades.length === 0) return null;
      
      const grade = grades[0];
      return {
        ...grade,
        students: grade.students[0]?.id ? grade.students : []
      };
    } catch (error) {
      console.error('🔴 [GRADE_FIND_BY_ID_ERROR]:', error);
      throw new Error('Failed to fetch grade by ID');
    }
  }

  // ============================================================================
  // FIND GRADE BY GRADE AND PART
  // ============================================================================
  static async findByGradeAndPart(gradeNumber: number, gradePart: string): Promise<GradeWithStudents | null> {
    const query = `
      SELECT 
        g.id,
        g.grade,
        g.grade_part,
        g.created_at,
        g.updated_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', s.id,
            'first_name', s.first_name,
            'last_name', s.last_name,
            'parent_phone', s.parent_phone,
            'assigned_at', sa.assigned_at
          )
        ) as students
      FROM grades g
      LEFT JOIN student_assignments sa ON g.id = sa.grade_id
      LEFT JOIN students s ON sa.student_id = s.id
      WHERE g.grade = ? AND g.grade_part = ?
      GROUP BY g.id, g.grade, g.grade_part, g.created_at, g.updated_at
    `;
    
    try {
      const [rows] = await pool.execute(query, [gradeNumber, gradePart]);
      const grades = rows as any[];
      
      if (grades.length === 0) return null;
      
      const grade = grades[0];
      return {
        ...grade,
        students: grade.students[0]?.id ? grade.students : []
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
    const query = `
      INSERT INTO grades (grade, grade_part) VALUES (?, ?)
    `;
    
    try {
      const [result] = await pool.execute(query, [gradeData.grade, gradeData.grade_part]);
      const insertedId = (result as any).insertId;
      
      // Return the created grade
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

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updateData as any)[field]);
    values.push(id);

    const query = `UPDATE grades SET ${setClause} WHERE id = ?`;

    try {
      await pool.execute(query, values);
      return await this.findById(id);
    } catch (error) {
      console.error('🔴 [GRADE_UPDATE_ERROR]:', error);
      throw new Error('Failed to update grade');
    }
  }

  // ============================================================================
  // DELETE GRADE
  // ============================================================================
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM grades WHERE id = ?';
    
    try {
      const [result] = await pool.execute(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('🔴 [GRADE_DELETE_ERROR]:', error);
      throw new Error('Failed to delete grade');
    }
  }

  // ============================================================================
  // CLEAR ALL GRADES
  // ============================================================================
  static async clearAll(): Promise<number> {
    const query = 'DELETE FROM grades';
    
    try {
      const [result] = await pool.execute(query);
      return (result as any).affectedRows;
    } catch (error) {
      console.error('🔴 [GRADE_CLEAR_ALL_ERROR]:', error);
      throw new Error('Failed to clear all grades');
    }
  }

  // ============================================================================
  // ASSIGN STUDENT TO GRADE
  // ============================================================================
  static async assignStudent(gradeId: number, studentId: number): Promise<boolean> {
    const query = `
      INSERT INTO student_assignments (grade_id, student_id) VALUES (?, ?)
    `;
    
    try {
      await pool.execute(query, [gradeId, studentId]);
      return true;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        // Student is already assigned to this grade
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
    const query = `
      DELETE FROM student_assignments WHERE grade_id = ? AND student_id = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [gradeId, studentId]);
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
    const query = `
      SELECT grade_id FROM student_assignments WHERE student_id = ? LIMIT 1
    `;
    
    try {
      const [rows] = await pool.execute(query, [studentId]);
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
  // GET GRADE STATISTICS
  // ============================================================================
  static async getStatistics(): Promise<{
    totalGrades: number;
    totalAssignedStudents: number;
    gradesWithStudents: number;
  }> {
    const query = `
      SELECT 
        COUNT(DISTINCT g.id) as totalGrades,
        COUNT(DISTINCT sa.student_id) as totalAssignedStudents,
        COUNT(DISTINCT CASE WHEN sa.student_id IS NOT NULL THEN g.id END) as gradesWithStudents
      FROM grades g
      LEFT JOIN student_assignments sa ON g.id = sa.grade_id
    `;
    
    try {
      const [rows] = await pool.execute(query);
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
}

export default GradeModel;
