import { getDb } from '../database/sqlite';

export interface EmailLog {
  id: number;
  student_id: number;
  parent_email: string;
  email_type: 'reminder' | 'warning' | 'confirmation';
  subject: string;
  message: string;
  sent_at: string;
}

export class EmailLogModel {
  static async create(emailData: Omit<EmailLog, 'id' | 'sent_at'>): Promise<EmailLog> {
    const db = getDb();
    const result = await db.run(
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
    
    const row = await db.get('SELECT * FROM email_logs WHERE id = ?', [result.lastID]);
    return row as EmailLog;
  }

  static async getByStudentId(studentId: number): Promise<EmailLog[]> {
    const db = getDb();
    const rows = await db.all(
      'SELECT * FROM email_logs WHERE student_id = ? ORDER BY sent_at DESC',
      [studentId]
    );
    return rows as EmailLog[];
  }

  static async getAll(): Promise<EmailLog[]> {
    const db = getDb();
    const rows = await db.all('SELECT * FROM email_logs ORDER BY sent_at DESC');
    return rows as EmailLog[];
  }
}
