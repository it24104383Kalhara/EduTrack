import pool from '../config/database';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'teacher';
  status?: 'pending' | 'approved' | 'rejected';
  first_name?: string;
  last_name?: string;
  gender?: string;
  grade?: string;
  phone_number?: string;
  birthday?: string;
  address?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.role, u.status, u.created_at, 
             COALESCE(t.first_name, u.first_name) as first_name,
             COALESCE(t.last_name, u.last_name) as last_name,
             COALESCE(t.gender, u.gender) as gender,
             COALESCE(t.grade, u.grade) as grade,
             COALESCE(t.phone_number, u.phone_number) as phone_number,
             COALESCE(t.birthday, u.birthday) as birthday,
             COALESCE(t.address, u.address) as address
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.id = ?`, [id]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }
  
  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    // Store all profile data in users table only.
    // Teacher details will be copied to teachers table ONLY when admin approves.
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, role, status, 
       first_name, last_name, gender, grade, phone_number, birthday, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.username, user.email, user.password_hash, user.role, user.status || 'pending',
        user.first_name || null,
        user.last_name || null,
        user.gender || null,
        user.grade || null,
        user.phone_number || null,
        user.birthday || null,
        user.address || null
      ]
    );
    return (result as any).insertId;
  }

  static async getPendingUsers(): Promise<User[]> {
    // Read profile data directly from users table (no JOIN to teachers needed)
    // Teachers table is only populated after admin approval
    const [rows] = await pool.execute(`
      SELECT id, username, email, role, status, created_at,
             first_name, last_name, gender, grade, phone_number, birthday, address
      FROM users
      WHERE status = ? ORDER BY created_at DESC`,
      ['pending']
    );
    return rows as User[];
  }

  static async getAllTeachers(): Promise<User[]> {
    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.role, u.status, u.created_at, 
             t.first_name, t.last_name, t.gender, t.grade, t.phone_number, t.birthday, t.address
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      WHERE u.role = ? AND u.status = ? ORDER BY u.created_at DESC`,
      ['teacher', 'approved']
    );
    return rows as User[];
  }

  static async updateTeacherDetails(id: number, details: Partial<User>): Promise<boolean> {
    const profileUpdates: string[] = [];
    const profileValues: any[] = [];
    
    if (details.first_name !== undefined) { profileUpdates.push('first_name = ?'); profileValues.push(details.first_name); }
    if (details.last_name !== undefined) { profileUpdates.push('last_name = ?'); profileValues.push(details.last_name); }
    if (details.gender !== undefined) { profileUpdates.push('gender = ?'); profileValues.push(details.gender); }
    if (details.grade !== undefined) { profileUpdates.push('grade = ?'); profileValues.push(details.grade); }
    if (details.phone_number !== undefined) { profileUpdates.push('phone_number = ?'); profileValues.push(details.phone_number); }
    if (details.birthday !== undefined) { profileUpdates.push('birthday = ?'); profileValues.push(details.birthday); }
    if (details.address !== undefined) { profileUpdates.push('address = ?'); profileValues.push(details.address); }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let affectedRows = 0;

      // Update email in both tables
      if (details.email !== undefined) {
        const [uResult] = await connection.execute(
          'UPDATE users SET email = ? WHERE id = ? AND role = "teacher"',
          [details.email, id]
        );
        affectedRows += (uResult as any).affectedRows;
      }

      // Update teachers table AND keep users table in sync
      if (profileUpdates.length > 0) {
        const valuesWithId = [...profileValues, id];

        const [tResult] = await connection.execute(
          `UPDATE teachers SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
          valuesWithId
        );
        affectedRows += (tResult as any).affectedRows;

        // Sync the same changes to users table (source of truth for pending/pre-approval state)
        await connection.execute(
          `UPDATE users SET ${profileUpdates.join(', ')} WHERE id = ? AND role = 'teacher'`,
          valuesWithId
        );
      }

      await connection.commit();
      return affectedRows > 0;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id: number, status: 'approved' | 'rejected'): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );
    return (result as any).affectedRows > 0;
  }

  static async updatePassword(username: string, password_hash: string): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [password_hash, username]
    );
    return (result as any).affectedRows > 0;
  }
}
