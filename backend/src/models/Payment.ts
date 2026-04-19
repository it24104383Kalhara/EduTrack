import { pool } from '../database/db';

export interface Payment {
  id: number;
  student_id: number;
  amount: number;
  due_date: Date;
  payment_date: Date | null;
  status: 'pending' | 'paid' | 'overdue';
  payment_type: 'hostel_fee' | 'tuition_fee' | 'mess_fee' | 'library_fee';
  email_sent: boolean;
  warning_sent: boolean;
  created_at: Date;
}

export interface PaymentWithStudent extends Payment {
  student: {
    id: number;
    registration_number: string;
    student_name: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
  };
}

export class PaymentModel {
  static async getAll(): Promise<PaymentWithStudent[]> {
    const [rows] = await pool.query(
      `SELECT p.*, s.id as student_id, s.registration_number, s.student_name, 
              s.parent_name, s.parent_email, s.parent_phone
       FROM payments p
       INNER JOIN students s ON p.student_id = s.id
       ORDER BY p.due_date DESC`
    );
    
    return (rows as any[]).map(row => ({
      id: row.id,
      student_id: row.student_id,
      amount: row.amount,
      due_date: row.due_date,
      payment_date: row.payment_date,
      status: row.status,
      payment_type: row.payment_type,
      email_sent: row.email_sent,
      warning_sent: row.warning_sent,
      created_at: row.created_at,
      student: {
        id: row.student_id,
        registration_number: row.registration_number,
        student_name: row.student_name,
        parent_name: row.parent_name,
        parent_email: row.parent_email,
        parent_phone: row.parent_phone
      }
    }));
  }

  static async getById(id: number): Promise<Payment | null> {
    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    const payments = rows as Payment[];
    return payments.length > 0 ? payments[0] : null;
  }

  static async getByStudentId(studentId: number): Promise<Payment[]> {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE student_id = ? ORDER BY due_date DESC',
      [studentId]
    );
    return rows as Payment[];
  }

  static async create(paymentData: Omit<Payment, 'id' | 'created_at' | 'payment_date' | 'email_sent' | 'warning_sent'>): Promise<Payment> {
    const [result] = await pool.query(
      `INSERT INTO payments (student_id, amount, due_date, status, payment_type) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        paymentData.student_id,
        paymentData.amount,
        paymentData.due_date,
        paymentData.status,
        paymentData.payment_type
      ]
    );
    
    const insertId = (result as any).insertId;
    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [insertId]);
    return (rows as Payment[])[0];
  }

  static async updateStatus(id: number, status: 'pending' | 'paid' | 'overdue', paymentDate?: Date): Promise<Payment | null> {
    const updateData: any = { status };
    if (paymentDate) {
      updateData.payment_date = paymentDate;
    }
    
    await pool.query(
      'UPDATE payments SET status = ?, payment_date = ? WHERE id = ?',
      [status, paymentDate || null, id]
    );
    
    return this.getById(id);
  }

  static async markEmailSent(id: number): Promise<void> {
    await pool.query('UPDATE payments SET email_sent = TRUE WHERE id = ?', [id]);
  }

  static async markWarningSent(id: number): Promise<void> {
    await pool.query('UPDATE payments SET warning_sent = TRUE WHERE id = ?', [id]);
  }

  static async getPendingPayments(): Promise<PaymentWithStudent[]> {
    const [rows] = await pool.query(
      `SELECT p.*, s.id as student_id, s.registration_number, s.student_name, 
              s.parent_name, s.parent_email, s.parent_phone
       FROM payments p
       INNER JOIN students s ON p.student_id = s.id
       WHERE p.status = 'pending'
       ORDER BY p.due_date ASC`
    );
    
    return (rows as any[]).map(row => ({
      id: row.id,
      student_id: row.student_id,
      amount: row.amount,
      due_date: row.due_date,
      payment_date: row.payment_date,
      status: row.status,
      payment_type: row.payment_type,
      email_sent: row.email_sent,
      warning_sent: row.warning_sent,
      created_at: row.created_at,
      student: {
        id: row.student_id,
        registration_number: row.registration_number,
        student_name: row.student_name,
        parent_name: row.parent_name,
        parent_email: row.parent_email,
        parent_phone: row.parent_phone
      }
    }));
  }

  static async getPaymentsDueInWeek(): Promise<PaymentWithStudent[]> {
    const [rows] = await pool.query(
      `SELECT p.*, s.id as student_id, s.registration_number, s.student_name, 
              s.parent_name, s.parent_email, s.parent_phone
       FROM payments p
       INNER JOIN students s ON p.student_id = s.id
       WHERE p.status = 'pending' 
       AND p.due_date >= CURDATE() 
       AND p.due_date <= CURDATE() + INTERVAL 7 DAY
       AND p.email_sent = FALSE
       ORDER BY p.due_date ASC`
    );
    
    return (rows as any[]).map(row => ({
      id: row.id,
      student_id: row.student_id,
      amount: row.amount,
      due_date: row.due_date,
      payment_date: row.payment_date,
      status: row.status,
      payment_type: row.payment_type,
      email_sent: row.email_sent,
      warning_sent: row.warning_sent,
      created_at: row.created_at,
      student: {
        id: row.student_id,
        registration_number: row.registration_number,
        student_name: row.student_name,
        parent_name: row.parent_name,
        parent_email: row.parent_email,
        parent_phone: row.parent_phone
      }
    }));
  }

  static async getOverduePayments(): Promise<PaymentWithStudent[]> {
    const [rows] = await pool.query(
      `SELECT p.*, s.id as student_id, s.registration_number, s.student_name, 
              s.parent_name, s.parent_email, s.parent_phone
       FROM payments p
       INNER JOIN students s ON p.student_id = s.id
       WHERE p.status = 'pending' 
       AND p.due_date < CURDATE()
       AND p.warning_sent = FALSE
       ORDER BY p.due_date ASC`
    );
    
    return (rows as any[]).map(row => ({
      id: row.id,
      student_id: row.student_id,
      amount: row.amount,
      due_date: row.due_date,
      payment_date: row.payment_date,
      status: row.status,
      payment_type: row.payment_type,
      email_sent: row.email_sent,
      warning_sent: row.warning_sent,
      created_at: row.created_at,
      student: {
        id: row.student_id,
        registration_number: row.registration_number,
        student_name: row.student_name,
        parent_name: row.parent_name,
        parent_email: row.parent_email,
        parent_phone: row.parent_phone
      }
    }));
  }

  static async createMonthlyPaymentsForAllStudents(): Promise<void> {
    const [students] = await pool.query('SELECT id FROM students WHERE assigned_room IS NOT NULL');
    
    const paymentTypes = [
      { type: 'hostel_fee', amount: 2000 },
      { type: 'tuition_fee', amount: 5000 },
      { type: 'mess_fee', amount: 1500 },
      { type: 'library_fee', amount: 500 }
    ];
    
    for (const student of students as any[]) {
      for (const paymentType of paymentTypes) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1, 31); // Set to 31st of next month
        
        await pool.query(
          `INSERT IGNORE INTO payments (student_id, amount, due_date, status, payment_type) 
           VALUES (?, ?, ?, 'pending', ?)`,
          [student.id, paymentType.amount, dueDate, paymentType.type]
        );
      }
    }
  }
}
