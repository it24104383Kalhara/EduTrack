import pool from '../config/database';

export interface Student {
  id?: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  religion: string;
  address: string;
  nationality: string;
  parent_type: 'father' | 'mother' | 'guardian';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_gender: 'male' | 'female' | 'other';
  parent_email?: string;
  parent_religion: string;
  parent_nationality: string;
  created_at?: Date;
  updated_at?: Date;
}

export class StudentModel {
  // Create the students table if it doesn't exist
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender ENUM('male', 'female', 'other') NOT NULL,
        religion VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        nationality VARCHAR(100) NOT NULL,
        parent_type ENUM('father', 'mother', 'guardian') NOT NULL,
        parent_name VARCHAR(200) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        parent_address TEXT NOT NULL,
        parent_gender ENUM('male', 'female', 'other') NOT NULL,
        parent_email VARCHAR(150),
        parent_religion VARCHAR(50) NOT NULL,
        parent_nationality VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await pool.execute(query);
      console.log('Students table created or already exists');
    } catch (error) {
      console.error('Error creating students table:', error);
      throw error;
    }
  }

  // Create a new student
  static async create(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    const query = `
      INSERT INTO students (
        first_name, last_name, date_of_birth, gender, religion, address, nationality,
        parent_type, parent_name, parent_phone, parent_address, parent_gender,
        parent_email, parent_religion, parent_nationality
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      student.first_name,
      student.last_name,
      student.date_of_birth,
      student.gender,
      student.religion,
      student.address,
      student.nationality,
      student.parent_type,
      student.parent_name,
      student.parent_phone,
      student.parent_address,
      student.parent_gender,
      student.parent_email || null,
      student.parent_religion,
      student.parent_nationality
    ];

    try {
      const [result] = await pool.execute(query, values);
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
    const query = 'SELECT * FROM students WHERE id = ?';
    
    try {
      const [rows] = await pool.execute(query, [id]);
      const students = rows as Student[];
      return students.length > 0 ? students[0] : null;
    } catch (error) {
      console.error('Error finding student by ID:', error);
      throw error;
    }
  }

  // Get all students
  static async findAll(): Promise<Student[]> {
    const query = 'SELECT * FROM students ORDER BY created_at DESC';
    
    try {
      const [rows] = await pool.execute(query);
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

    const query = `UPDATE students SET ${setClause} WHERE id = ?`;

    try {
      await pool.execute(query, values);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  // Delete student
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM students WHERE id = ?';
    
    try {
      const [result] = await pool.execute(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
}
