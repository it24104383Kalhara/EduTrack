import pool from '../config/database';
import { STUDENT_QUERIES } from './DatabaseQueries';

export interface Student {
  id?: number;
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
  updated_at?: Date;
}

export class StudentModel {

  // Create a new student
  static async create(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    const values = [
      student.first_name,
      student.last_name,
      student.date_of_birth,
      student.gender,
      student.religion,
      student.ethnicity,
      student.address,
      student.nationality,
      student.parent_type,
      student.parent_name,
      student.parent_phone,
      student.parent_address,
      student.parent_gender,
      student.parent_email || null,
      student.parent_religion,
      student.parent_ethnicity,
      student.parent_nationality
    ];

    try {
      const [result] = await pool.execute(STUDENT_QUERIES.CREATE, values);
      const insertedId = (result as any).insertId;
      
      // Return the created student with ID
      const createdStudent = await this.findById(insertedId);
      if (!createdStudent) {
        throw new Error('Failed to retrieve created student');
      }
      return createdStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  // Get student by ID
  static async findById(id: number): Promise<Student | null> {
    try {
      const [rows] = await pool.execute(STUDENT_QUERIES.FIND_BY_ID, [id]);
      const students = rows as Student[];
      return students.length > 0 ? students[0] : null;
    } catch (error) {
      console.error('Error finding student by ID:', error);
      throw error;
    }
  }

  // Get all students
  static async findAll(): Promise<Student[]> {
    try {
      const [rows] = await pool.execute(STUDENT_QUERIES.FIND_ALL);
      return rows as Student[];
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  }

  // Update student
  static async update(id: number, student: Partial<Student>): Promise<Student | null> {
    const fields = Object.keys(student).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    if (fields.length === 0) return null;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (student as any)[field]);
    values.push(id);

    try {
      await pool.execute(STUDENT_QUERIES.UPDATE(setClause), values);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  // Delete student
  static async delete(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute(STUDENT_QUERIES.DELETE, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
}
