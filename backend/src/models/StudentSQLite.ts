import { getDb } from '../database/sqlite';

export interface Student {
  id: number;
  registration_number: string;
  student_name: string;
  grade: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  registered_at: string;
  assigned_room: number | null;
}

export interface StudentWithRoom extends Student {
  room_number?: string;
}

export class StudentModel {
  static async getAll(): Promise<StudentWithRoom[]> {
    const db = getDb();
    const rows = await db.all(
      `SELECT s.*, r.room_number 
       FROM students s 
       LEFT JOIN rooms r ON s.assigned_room = r.id 
       ORDER BY s.student_name`
    );
    return rows as StudentWithRoom[];
  }

  static async getById(id: number): Promise<Student | null> {
    const db = getDb();
    const row = await db.get('SELECT * FROM students WHERE id = ?', [id]);
    return row as Student || null;
  }

  static async getByRegistrationNumber(regNumber: string): Promise<Student | null> {
    const db = getDb();
    const row = await db.get('SELECT * FROM students WHERE registration_number = ?', [regNumber]);
    return row as Student || null;
  }

  static async create(studentData: Omit<Student, 'id' | 'registered_at' | 'assigned_room'>): Promise<Student> {
    const db = getDb();
    const registrationNumber = await this.generateRegistrationNumber();
    
    const result = await db.run(
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
    
    const row = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
    return row as Student;
  }

  static async update(id: number, studentData: Partial<Omit<Student, 'id' | 'registered_at' | 'registration_number'>>): Promise<Student | null> {
    const db = getDb();
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
      await db.run(
        `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    return this.getById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const db = getDb();
    const result = await db.run('DELETE FROM students WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  static async assignToRoom(studentId: number, roomId: number): Promise<boolean> {
    const db = getDb();
    
    // Check room capacity
    const occupancy = await db.get(
      `SELECT COUNT(*) as count, capacity FROM students s
       JOIN rooms r ON s.assigned_room = r.id
       WHERE s.assigned_room = ?`,
      [roomId]
    );
    
    if (occupancy && occupancy.count >= occupancy.capacity) {
      return false;
    }
    
    await db.run(
      'UPDATE students SET assigned_room = ? WHERE id = ?',
      [roomId, studentId]
    );
    
    return true;
  }

  static async removeFromRoom(studentId: number): Promise<void> {
    const db = getDb();
    await db.run(
      'UPDATE students SET assigned_room = NULL WHERE id = ?',
      [studentId]
    );
  }

  static async getStudentsInRoom(roomId: number): Promise<Student[]> {
    const db = getDb();
    const rows = await db.all(
      'SELECT * FROM students WHERE assigned_room = ? ORDER BY student_name',
      [roomId]
    );
    return rows as Student[];
  }

  static async getUnassignedStudents(): Promise<Student[]> {
    const db = getDb();
    const rows = await db.all(
      'SELECT * FROM students WHERE assigned_room IS NULL ORDER BY student_name'
    );
    return rows as Student[];
  }

  private static async generateRegistrationNumber(): Promise<string> {
    const db = getDb();
    const year = new Date().getFullYear();
    const row = await db.get(
      'SELECT COUNT(*) as count FROM students WHERE registration_number LIKE ?',
      [`REG${year}%`]
    );
    const count = row.count;
    const sequenceNumber = (count + 1).toString().padStart(3, '0');
    return `REG${year}${sequenceNumber}`;
  }

  static async getStudentsWithPendingPayments(): Promise<Student[]> {
    const db = getDb();
    const rows = await db.all(
      `SELECT DISTINCT s.* FROM students s
       INNER JOIN payments p ON s.id = p.student_id
       WHERE p.status = 'pending' AND date(p.due_date) <= date('now', '+7 days')
       AND p.email_sent = FALSE`
    );
    return rows as Student[];
  }

  static async getStudentsWithOverduePayments(): Promise<Student[]> {
    const db = getDb();
    const rows = await db.all(
      `SELECT DISTINCT s.* FROM students s
       INNER JOIN payments p ON s.id = p.student_id
       WHERE p.status = 'pending' AND date(p.due_date) < date('now')
       AND p.warning_sent = FALSE`
    );
    return rows as Student[];
  }
}
