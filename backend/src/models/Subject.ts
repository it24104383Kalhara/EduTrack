import pool from '../config/database';
import { SUBJECT_QUERIES } from './DatabaseQueries';

export interface Subject {
  id: number;
  name: string;
  code: string;
  grades: string | string[];
  stream?: string | string[];
  type: '6-11' | '12-13';
  category?: string;
  is_optional?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface SubjectWithDetails extends Subject {
  grade_array: string[];
  stream_array?: string[];
}

export class SubjectModel {

  // Get all subjects
  static async findAll(): Promise<SubjectWithDetails[]> {
    try {
      const [rows] = await pool.execute(SUBJECT_QUERIES.FIND_ALL);
      const subjects = rows as any[];
      
      return subjects.map(subject => {
        const parseField = (field: any) => {
          if (!field) return [];
          const parsed = Array.isArray(field) ? field : JSON.parse(field);
          return (Array.isArray(parsed) ? parsed : [parsed]).flatMap(item => {
            if (typeof item === 'string' && item.startsWith('[')) {
              try { return JSON.parse(item); } catch { return item; }
            }
            return item;
          });
        };

        const grades = parseField(subject.grades);
        const stream = subject.stream ? parseField(subject.stream) : undefined;
        return {
          ...subject,
          grades,
          grade_array: grades,
          stream,
          stream_array: stream
        };
      });
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_ALL_ERROR]:', error);
      throw new Error('Failed to fetch all subjects');
    }
  }

  // Get subject by ID
  static async findById(id: number): Promise<SubjectWithDetails | null> {
    try {
      const [rows] = await pool.execute(SUBJECT_QUERIES.FIND_BY_ID, [id]);
      const subjects = rows as any[];
      
      if (subjects.length === 0) {
        return null;
      }
      
      const subject = subjects[0];
      const parseField = (field: any) => {
        if (!field) return [];
        const parsed = Array.isArray(field) ? field : JSON.parse(field);
        return (Array.isArray(parsed) ? parsed : [parsed]).flatMap(item => {
          if (typeof item === 'string' && item.startsWith('[')) {
            try { return JSON.parse(item); } catch { return item; }
          }
          return item;
        });
      };

      const grades = parseField(subject.grades);
      const stream = subject.stream ? parseField(subject.stream) : undefined;
      
      return {
        ...subject,
        grades,
        grade_array: grades,
        stream,
        stream_array: stream
      };
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_BY_ID_ERROR]:', error);
      throw new Error('Failed to fetch subject by ID');
    }
  }

  // Create new subject
  static async create(subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject> {
    const gradesArray = Array.isArray(subject.grades) ? subject.grades : [subject.grades];
    
    try {
      const [result] = await pool.execute(SUBJECT_QUERIES.CREATE, [
        subject.name,
        subject.code,
        JSON.stringify(gradesArray),
        subject.stream ? JSON.stringify(Array.isArray(subject.stream) ? subject.stream : [subject.stream]) : null,
        subject.type,
        subject.category || null,
        subject.is_optional ? 1 : 0
      ]);
      
      const id = (result as any).insertId;
      
      return {
        id,
        ...subject,
        grades: gradesArray,
        stream: subject.stream ? (Array.isArray(subject.stream) ? subject.stream : [subject.stream]) : undefined,
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
  static async update(id: number, updates: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>): Promise<Subject | null> {
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

    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }

    if (updates.is_optional !== undefined) {
      fields.push('is_optional = ?');
      values.push(updates.is_optional ? 1 : 0);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const setClause = fields.join(', ');
    values.push(id);
    
    try {
      const [result] = await pool.execute(SUBJECT_QUERIES.UPDATE(setClause), values);
      if ((result as any).affectedRows === 0) {
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
  static async delete(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute(SUBJECT_QUERIES.DELETE, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('🔴 [SUBJECT_DELETE_ERROR]:', error);
      throw new Error('Failed to delete subject');
    }
  }

  // Check if subject code exists
  static async findByCode(code: string, excludeId?: number): Promise<Subject | null> {
    try {
      const params = excludeId ? [code, excludeId] : [code];
      const [rows] = await pool.execute(SUBJECT_QUERIES.FIND_BY_CODE(!!excludeId), params);
      const subjects = rows as any[];
      return subjects.length > 0 ? subjects[0] : null;
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
    excludeId?: number
  ): Promise<Subject | null> {
    try {
      let params: any[];
      if (excludeId) {
        if (stream) {
          params = [name, JSON.stringify([grade]), JSON.stringify([stream]), excludeId];
        } else {
          params = [name, JSON.stringify([grade]), excludeId];
        }
      } else {
        if (stream) {
          params = [name, JSON.stringify([grade]), JSON.stringify([stream])];
        } else {
          params = [name, JSON.stringify([grade])];
        }
      }
      
      const [rows] = await pool.execute(SUBJECT_QUERIES.FIND_DUPLICATE(!!stream, !!excludeId), params);
      const subjects = rows as any[];
      return subjects.length > 0 ? subjects[0] : null;
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_DUPLICATE_ERROR]:', error);
      throw new Error('Failed to check for duplicate subject');
    }
  }

  // Get subjects by type
  static async findByType(type: '6-11' | '12-13'): Promise<SubjectWithDetails[]> {
    try {
      const [rows] = await pool.execute(SUBJECT_QUERIES.FIND_BY_TYPE, [type]);
      const subjects = rows as any[];
      
      return subjects.map(subject => {
        const parseField = (field: any) => {
          if (!field) return [];
          const parsed = Array.isArray(field) ? field : JSON.parse(field);
          return (Array.isArray(parsed) ? parsed : [parsed]).flatMap(item => {
            if (typeof item === 'string' && item.startsWith('[')) {
              try { return JSON.parse(item); } catch { return item; }
            }
            return item;
          });
        };

        const grades = parseField(subject.grades);
        const stream = subject.stream ? parseField(subject.stream) : undefined;
        return {
          ...subject,
          grades,
          grade_array: grades,
          stream,
          stream_array: stream
        };
      });
    } catch (error) {
      console.error('🔴 [SUBJECT_FIND_BY_TYPE_ERROR]:', error);
      throw new Error('Failed to fetch subjects by type');
    }
  }
}
