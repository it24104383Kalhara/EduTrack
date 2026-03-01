import pool from '../config/database';

export interface Mark {
  id?: number;
  studentId: number;
  subjectId: string;
  marks: number;
  maxMarks: number;
  examType: string;
  date: string;
  createdAt?: Date;
}

export class MarkModel {
  static async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id VARCHAR(50) NOT NULL,
        marks DECIMAL(5,2) NOT NULL,
        max_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
        exam_type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        INDEX idx_student_subject (student_id, subject_id),
        INDEX idx_exam_date (exam_type, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.execute(query);
      console.log('✅ Marks table created or already exists');
    } catch (error) {
      console.error('❌ Error creating marks table:', error);
      throw error;
    }
  }

  static async create(mark: Omit<Mark, 'id' | 'createdAt'>): Promise<Mark> {
    const query = `
      INSERT INTO marks (student_id, subject_id, marks, max_marks, exam_type, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await pool.execute(query, [
        mark.studentId,
        mark.subjectId,
        mark.marks,
        mark.maxMarks,
        mark.examType,
        mark.date
      ]);
      
      const insertId = (result as any).insertId;
      return {
        id: insertId,
        ...mark,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error creating mark:', error);
      throw error;
    }
  }

  static async findAll(): Promise<Mark[]> {
    const query = `
      SELECT 
        id,
        student_id as studentId,
        subject_id as subjectId,
        marks,
        max_marks as maxMarks,
        exam_type as examType,
        date,
        created_at as createdAt
      FROM marks
      ORDER BY date DESC, created_at DESC
    `;
    
    try {
      const [rows] = await pool.execute(query);
      return rows as Mark[];
    } catch (error) {
      console.error('❌ Error fetching marks:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Mark | null> {
    const query = `
      SELECT 
        id,
        student_id as studentId,
        subject_id as subjectId,
        marks,
        max_marks as maxMarks,
        exam_type as examType,
        date,
        created_at as createdAt
      FROM marks
      WHERE id = ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [id]);
      const marks = rows as Mark[];
      return marks.length > 0 ? marks[0] : null;
    } catch (error) {
      console.error('❌ Error fetching mark by ID:', error);
      throw error;
    }
  }

  static async findByStudentId(studentId: number): Promise<Mark[]> {
    const query = `
      SELECT 
        id,
        student_id as studentId,
        subject_id as subjectId,
        marks,
        max_marks as maxMarks,
        exam_type as examType,
        date,
        created_at as createdAt
      FROM marks
      WHERE student_id = ?
      ORDER BY date DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows as Mark[];
    } catch (error) {
      console.error('❌ Error fetching marks by student ID:', error);
      throw error;
    }
  }

  static async findBySubjectId(subjectId: string): Promise<Mark[]> {
    const query = `
      SELECT 
        id,
        student_id as studentId,
        subject_id as subjectId,
        marks,
        max_marks as maxMarks,
        exam_type as examType,
        date,
        created_at as createdAt
      FROM marks
      WHERE subject_id = ?
      ORDER BY date DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [subjectId]);
      return rows as Mark[];
    } catch (error) {
      console.error('❌ Error fetching marks by subject ID:', error);
      throw error;
    }
  }

  static async findByGradeAndSection(grade: string, section: string): Promise<Mark[]> {
    const query = `
      SELECT 
        m.id,
        m.student_id as studentId,
        m.subject_id as subjectId,
        m.marks,
        m.max_marks as maxMarks,
        m.exam_type as examType,
        m.date,
        m.created_at as createdAt
      FROM marks m
      INNER JOIN students s ON m.student_id = s.id
      WHERE s.grade = ? AND s.section = ?
      ORDER BY m.date DESC, m.created_at DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [grade, section]);
      return rows as Mark[];
    } catch (error) {
      console.error('❌ Error fetching marks by grade and section:', error);
      throw error;
    }
  }

  static async update(id: number, updates: Partial<Omit<Mark, 'id' | 'studentId' | 'subjectId' | 'createdAt'>>): Promise<Mark | null> {
    const fields = [];
    const values = [];
    
    if (updates.marks !== undefined) {
      fields.push('marks = ?');
      values.push(updates.marks);
    }
    if (updates.maxMarks !== undefined) {
      fields.push('max_marks = ?');
      values.push(updates.maxMarks);
    }
    if (updates.examType !== undefined) {
      fields.push('exam_type = ?');
      values.push(updates.examType);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    const query = `
      UPDATE marks
      SET ${fields.join(', ')}
      WHERE id = ?
    `;
    
    try {
      await pool.execute(query, [...values, id]);
      return this.findById(id);
    } catch (error) {
      console.error('❌ Error updating mark:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM marks WHERE id = ?';
    
    try {
      const [result] = await pool.execute(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('❌ Error deleting mark:', error);
      throw error;
    }
  }

  static async deleteAll(): Promise<void> {
    const query = 'DELETE FROM marks';
    
    try {
      await pool.execute(query);
      console.log('✅ All marks deleted');
    } catch (error) {
      console.error('❌ Error deleting all marks:', error);
      throw error;
    }
  }
}
