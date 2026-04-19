import { pool } from '../database/db';

export interface Student {
  id: number;
  registration_number: string;
  student_name: string;
  grade: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  registered_at: Date;
  assigned_room: number | null;
}

export interface StudentWithRoom extends Student {
  room_number?: string;
}

export class StudentModel {
  static async getAll(): Promise<Student[]> {
    const [rows] = await pool.query(
      `SELECT s.*, r.room_number 
       FROM students s 
       LEFT JOIN rooms r ON s.assigned_room = r.id 
       ORDER BY s.student_name`
    );
    return rows as StudentWithRoom[];
  }

  static async getById(id: number): Promise<Student | null> {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    const students = rows as Student[];
    return students.length > 0 ? students[0] : null;
  }

  static async getByRegistrationNumber(regNumber: string): Promise<Student | null> {
    const [rows] = await pool.query('SELECT * FROM students WHERE registration_number = ?', [regNumber]);
    const students = rows as Student[];
    return students.length > 0 ? students[0] : null;
  }

  static async create(studentData: Omit<Student, 'id' | 'registered_at' | 'assigned_room'>): Promise<Student> {
    const registrationNumber = await this.generateRegistrationNumber();
    
    const [result] = await pool.query(
      `INSERT INTO students (registration_number, student_name, grade, address, parent_name, parent_phone, parent_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        registrationNumber,
        studentData.student_name,
        studentData.grade,
        studentData.address,
        studentData.parent_name,
        studentData.parent_phone,
        studentData.parent_email
      ]
    );
    
    const insertId = (result as any).insertId;
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [insertId]);
    return (rows as Student[])[0];
  }

  static async update(id: number, studentData: Partial<Omit<Student, 'id' | 'registered_at' | 'registration_number'>>): Promise<Student | null> {
    const fields = [];
    const values = [];
    
    if (studentData.student_name) {
      fields.push('student_name = ?');
      values.push(studentData.student_name);
    }
    if (studentData.grade) {
      fields.push('grade = ?');
      values.push(studentData.grade);
    }
    if (studentData.address) {
      fields.push('address = ?');
      values.push(studentData.address);
    }
    if (studentData.parent_name) {
      fields.push('parent_name = ?');
      values.push(studentData.parent_name);
    }
    if (studentData.parent_phone) {
      fields.push('parent_phone = ?');
      values.push(studentData.parent_phone);
    }
    if (studentData.parent_email) {
      fields.push('parent_email = ?');
      values.push(studentData.parent_email);
    }
    if (studentData.assigned_room !== undefined) {
      fields.push('assigned_room = ?');
      values.push(studentData.assigned_room);
    }
    
    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    return this.getById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  static async assignToRoom(studentId: number, roomId: number): Promise<boolean> {
    const isFull = await pool.query(
      `SELECT COUNT(*) as count FROM students WHERE assigned_room = ?`,
      [roomId]
    );
    
    const roomCapacity = await pool.query(
      `SELECT capacity FROM rooms WHERE id = ?`,
      [roomId]
    );
    
    const currentOccupancy = (isFull[0] as any)[0].count;
    const capacity = (roomCapacity[0] as any)[0]?.capacity;
    
    if (capacity && currentOccupancy >= capacity) {
      return false;
    }
    
    await pool.query(
      'UPDATE students SET assigned_room = ? WHERE id = ?',
      [roomId, studentId]
    );
    
    return true;
  }

  static async removeFromRoom(studentId: number): Promise<void> {
    await pool.query(
      'UPDATE students SET assigned_room = NULL WHERE id = ?',
      [studentId]
    );
  }

  static async getStudentsInRoom(roomId: number): Promise<Student[]> {
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE assigned_room = ? ORDER BY student_name',
      [roomId]
    );
    return rows as Student[];
  }

  static async getUnassignedStudents(): Promise<Student[]> {
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE assigned_room IS NULL ORDER BY student_name'
    );
    return rows as Student[];
  }

  private static async generateRegistrationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM students WHERE registration_number LIKE ?',
      [`REG${year}%`]
    );
    const count = (rows as any)[0].count;
    const sequenceNumber = (count + 1).toString().padStart(3, '0');
    return `REG${year}${sequenceNumber}`;
  }

  static async getStudentsWithPendingPayments(): Promise<Student[]> {
    const [rows] = await pool.query(
      `SELECT DISTINCT s.* FROM students s
       INNER JOIN payments p ON s.id = p.student_id
       WHERE p.status = 'pending' AND p.due_date <= CURDATE() + INTERVAL 7 DAY
       AND p.email_sent = FALSE`
    );
    return rows as Student[];
  }

  static async getStudentsWithOverduePayments(): Promise<Student[]> {
    const [rows] = await pool.query(
      `SELECT DISTINCT s.* FROM students s
       INNER JOIN payments p ON s.id = p.student_id
       WHERE p.status = 'pending' AND p.due_date < CURDATE()
       AND p.warning_sent = FALSE`
    );
    return rows as Student[];
  }
}
