import { pool } from '../database/db';

export interface EmailLog {
  id: number;
  student_id: number;
  parent_email: string;
  email_type: 'reminder' | 'warning' | 'confirmation';
  subject: string;
  message: string;
  sent_at: Date;
}

export class EmailLogModel {
  static async create(emailData: Omit<EmailLog, 'id' | 'sent_at'>): Promise<EmailLog> {
    const [result] = await pool.query(
      `INSERT INTO email_logs (student_id, parent_email, email_type, subject, message) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        emailData.student_id,
        emailData.parent_email,
        emailData.email_type,
        emailData.subject,
        emailData.message
      ]
    );
    
    const insertId = (result as any).insertId;
    const [rows] = await pool.query('SELECT * FROM email_logs WHERE id = ?', [insertId]);
    return (rows as EmailLog[])[0];
  }

  static async getByStudentId(studentId: number): Promise<EmailLog[]> {
    const [rows] = await pool.query(
      'SELECT * FROM email_logs WHERE student_id = ? ORDER BY sent_at DESC',
      [studentId]
    );
    return rows as EmailLog[];
  }

  static async getAll(): Promise<EmailLog[]> {
    const [rows] = await pool.query('SELECT * FROM email_logs ORDER BY sent_at DESC');
    return rows as EmailLog[];
  }
}
