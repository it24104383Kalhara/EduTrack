import pool from '../config/database';

export interface Attendance {
  id: number;
  student_id: number;
  grade_id: number;
  date: string;
  status: number; // 1 for present, 0 for absent
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithDetails extends Attendance {
  student_name: string;
  grade_name: string;
}

export class AttendanceModel {
  // Create attendance table
  static async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        grade_id INT NOT NULL,
        date DATE NOT NULL,
        status TINYINT NOT NULL DEFAULT 1, -- 1 for present, 0 for absent
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_grade_date (student_id, grade_id, date),
        INDEX idx_date (date),
        INDEX idx_student_grade (student_id, grade_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await pool.execute(query);
      console.log('✅ Attendance table created or already exists');
    } catch (error) {
      console.error('❌ Error creating attendance table:', error);
      throw error;
    }
  }

  // Get attendance by date and grade
  static async getByDateAndGrade(date: string, gradeId: number): Promise<AttendanceWithDetails[]> {
    const query = `
      SELECT 
        a.id,
        a.student_id,
        a.grade_id,
        a.date,
        a.status,
        a.created_at,
        a.updated_at,
        s.first_name,
        s.last_name,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        g.grade as grade_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN grades g ON a.grade_id = g.id
      WHERE a.date = ? AND a.grade_id = ?
      ORDER BY s.first_name, s.last_name
    `;
    
    try {
      const [rows] = await pool.execute(query, [date, gradeId]);
      return rows as AttendanceWithDetails[];
    } catch (error) {
      console.error('❌ Error fetching attendance by date and grade:', error);
      throw error;
    }
  }

  // Get all attendance for a student
  static async getByStudent(studentId: number): Promise<Attendance[]> {
    const query = `
      SELECT * FROM attendance 
      WHERE student_id = ? 
      ORDER BY date DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [studentId]);
      return rows as Attendance[];
    } catch (error) {
      console.error('❌ Error fetching attendance by student:', error);
      throw error;
    }
  }

  // Create or update attendance record
  static async createOrUpdate(attendance: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>): Promise<Attendance> {
    const query = `
      INSERT INTO attendance (student_id, grade_id, date, status)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    try {
      const [result] = await pool.execute(query, [
        attendance.student_id,
        attendance.grade_id,
        attendance.date,
        attendance.status
      ]);
      
      // Return the created/updated record
      const [rows] = await pool.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [(result as any).insertId]
      );
      
      return (rows as Attendance[])[0];
    } catch (error) {
      console.error('❌ Error creating/updating attendance:', error);
      throw error;
    }
  }

  // Bulk create/update attendance for multiple students
  static async bulkCreateOrUpdate(attendanceRecords: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (attendanceRecords.length === 0) return;
    
    const query = `
      INSERT INTO attendance (student_id, grade_id, date, status)
      VALUES ?
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    try {
      const values = attendanceRecords.map(record => [
        record.student_id,
        record.grade_id,
        record.date,
        record.status
      ]);
      
      await pool.execute(query, [values]);
      console.log(`✅ Bulk attendance updated for ${attendanceRecords.length} records`);
    } catch (error) {
      console.error('❌ Error in bulk attendance update:', error);
      throw error;
    }
  }

  // Get attendance statistics for a grade on a specific date
  static async getGradeStats(date: string, gradeId: number): Promise<{
    total: number;
    present: number;
    absent: number;
    percentage: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as absent
      FROM attendance 
      WHERE date = ? AND grade_id = ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [date, gradeId]);
      const result = rows as any[];
      const stats = result[0];
      
      const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      
      return {
        total: stats.total,
        present: stats.present,
        absent: stats.absent,
        percentage
      };
    } catch (error) {
      console.error('❌ Error fetching grade attendance stats:', error);
      throw error;
    }
  }

  // Get monthly attendance statistics for a grade
  static async getMonthlyStats(gradeId: number, year: number, month: number): Promise<any[]> {
    const query = `
      SELECT 
        DATE(date) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as absent,
        ROUND((SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
      FROM attendance 
      WHERE grade_id = ? 
        AND YEAR(date) = ? 
        AND MONTH(date) = ?
      GROUP BY DATE(date)
      ORDER BY date
    `;
    
    try {
      const [rows] = await pool.execute(query, [gradeId, year, month]);
      return rows as any[];
    } catch (error) {
      console.error('❌ Error fetching monthly attendance stats:', error);
      throw error;
    }
  }

  // Delete attendance record
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM attendance WHERE id = ?';
    
    try {
      const [result] = await pool.execute(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('❌ Error deleting attendance:', error);
      throw error;
    }
  }
}
