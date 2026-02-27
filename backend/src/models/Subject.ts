import pool from '../config/database';

export interface Subject {
  id: string;
  name: string;
  code: string;
  grades: string | string[];
  stream?: string | string[];
  type: '6-11' | '12-13';
  created_at?: Date;
  updated_at?: Date;
}

export interface SubjectWithDetails extends Subject {
  grade_array: string[];
  stream_array?: string[];
}

export class SubjectModel {
  // Create subjects table
  static async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        grades JSON NOT NULL,
        stream JSON,
        type ENUM('6-11', '12-13') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_code (code),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.execute(query);
      console.log('✅ Subjects table created or already exists');
    } catch (error) {
      console.error('❌ Error creating subjects table:', error);
      throw error;
    }
  }

  // Get all subjects
  static async findAll(): Promise<SubjectWithDetails[]> {
    const query = `
      SELECT 
        id,
        name,
        code,
        grades,
        stream,
        type,
        created_at,
        updated_at
      FROM subjects
      ORDER BY 
        type ASC,
        name ASC
    `;
    
    try {
      const [rows] = await pool.execute(query);
      const subjects = rows as any[];
      
      return subjects.map(subject => ({
        ...subject,
        grade_array: Array.isArray(subject.grades) ? subject.grades : JSON.parse(subject.grades || '[]'),
        stream_array: subject.stream ? (Array.isArray(subject.stream) ? subject.stream : JSON.parse(subject.stream)) : undefined
      }));
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_ALL_ERROR]:', error);
      throw new Error('Failed to fetch all subjects');
    }
  }

  // Get subject by ID
  static async findById(id: string): Promise<SubjectWithDetails | null> {
    const query = `
      SELECT 
        id,
        name,
        code,
        grades,
        stream,
        type,
        created_at,
        updated_at
      FROM subjects
      WHERE id = ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [id]);
      const subjects = rows as any[];
      
      if (subjects.length === 0) {
        return null;
      }
      
      const subject = subjects[0];
      return {
        ...subject,
        grade_array: Array.isArray(subject.grades) ? subject.grades : JSON.parse(subject.grades || '[]'),
        stream_array: subject.stream ? (Array.isArray(subject.stream) ? subject.stream : JSON.parse(subject.stream)) : undefined
      };
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_BY_ID_ERROR]:', error);
      throw new Error('Failed to fetch subject by ID');
    }
  }

  // Create new subject
  static async create(subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> {
    const id = `SUBJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const gradesArray = Array.isArray(subject.grades) ? subject.grades : [subject.grades];
    
    const query = `
      INSERT INTO subjects (
        id, name, code, grades, stream, type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await pool.execute(query, [
        id,
        subject.name,
        subject.code,
        JSON.stringify(gradesArray),
        subject.stream ? JSON.stringify(Array.isArray(subject.stream) ? subject.stream : [subject.stream]) : null,
        subject.type
      ]);
      
      return {
        id,
        ...subject,
        grades: JSON.stringify(gradesArray),
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      console.error('🔴 [SUBJECT_CREATE_ERROR]:', error);
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        throw new Error('Subject code already exists');
      }
      throw new Error('Failed to create subject');
    }
  }

  // Update subject
  static async update(id: string, updates: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>): Promise<Subject | null> {
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    
    if (updates.code !== undefined) {
      fields.push('code = ?');
      values.push(updates.code);
    }
    
    if (updates.grades !== undefined) {
      fields.push('grades = ?');
      const gradesArray = Array.isArray(updates.grades) ? updates.grades : [updates.grades];
      values.push(JSON.stringify(gradesArray));
    }
    
    if (updates.stream !== undefined) {
      fields.push('stream = ?');
      values.push(updates.stream ? JSON.stringify(Array.isArray(updates.stream) ? updates.stream : [updates.stream]) : null);
    }
    
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `
      UPDATE subjects 
      SET ${fields.join(', ')}
      WHERE id = ?
    `;
    
    values.push(id);
    
    try {
      const [result] = await pool.execute(query, values);
      const affectedRows = (result as any).affectedRows;
      
      if (affectedRows === 0) {
        return null;
      }
      
      return await this.findById(id);
    } catch (error) {
      console.error('🔴 [SUBJECT_UPDATE_ERROR]:', error);
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        throw new Error('Subject code already exists');
      }
      throw new Error('Failed to update subject');
    }
  }

  // Delete subject
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM subjects WHERE id = ?';
    
    try {
      const [result] = await pool.execute(query, [id]);
      const affectedRows = (result as any).affectedRows;
      return affectedRows > 0;
    } catch (error) {
      console.error('🔴 [SUBJECT_DELETE_ERROR]:', error);
      throw new Error('Failed to delete subject');
    }
  }

  // Check if subject code exists
  static async findByCode(code: string, excludeId?: string): Promise<Subject | null> {
    const query = `
      SELECT id, name, code, grades, stream, type, created_at, updated_at
      FROM subjects
      WHERE code = ? ${excludeId ? 'AND id != ?' : ''}
    `;
    
    try {
      const params = excludeId ? [code, excludeId] : [code];
      const [rows] = await pool.execute(query, params);
      const subjects = rows as any[];
      
      if (subjects.length === 0) {
        return null;
      }
      
      return subjects[0];
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_BY_CODE_ERROR]:', error);
      throw new Error('Failed to check subject code');
    }
  }

  // Check for duplicate subject in grade and stream
  static async findDuplicateInGradeStream(
    name: string, 
    grade: string, 
    stream?: string, 
    excludeId?: string
  ): Promise<Subject | null> {
    const query = `
      SELECT id, name, code, grades, stream, type, created_at, updated_at
      FROM subjects
      WHERE LOWER(name) = LOWER(?)
        AND JSON_CONTAINS(grades, ?)
        ${stream ? 'AND JSON_CONTAINS(stream, ?)' : 'AND stream IS NULL'}
        ${excludeId ? 'AND id != ?' : ''}
    `;
    
    try {
      const params = excludeId 
        ? [name, JSON.stringify([grade]), stream ? JSON.stringify([stream]) : null, excludeId]
        : [name, JSON.stringify([grade]), stream ? JSON.stringify([stream]) : null];
      
      const [rows] = await pool.execute(query, params);
      const subjects = rows as any[];
      
      if (subjects.length === 0) {
        return null;
      }
      
      return subjects[0];
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_DUPLICATE_ERROR]:', error);
      throw new Error('Failed to check for duplicate subject');
    }
  }

  // Get subjects by type
  static async findByType(type: '6-11' | '12-13'): Promise<SubjectWithDetails[]> {
    const query = `
      SELECT 
        id, name, code, grades, stream, type, created_at, updated_at
      FROM subjects
      WHERE type = ?
      ORDER BY name ASC
    `;
    
    try {
      const [rows] = await pool.execute(query, [type]);
      const subjects = rows as any[];
      
      return subjects.map(subject => ({
        ...subject,
        grade_array: Array.isArray(subject.grades) ? subject.grades : JSON.parse(subject.grades || '[]'),
        stream_array: subject.stream ? (Array.isArray(subject.stream) ? subject.stream : JSON.parse(subject.stream)) : undefined
      }));
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_BY_TYPE_ERROR]:', error);
      throw new Error('Failed to fetch subjects by type');
    }
  }
}
