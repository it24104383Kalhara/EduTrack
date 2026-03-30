import pool from '../config/database';
import { USER_QUERIES } from './DatabaseQueries';

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
    const [rows] = await pool.execute(USER_QUERIES.FIND_BY_USERNAME, [username]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute(USER_QUERIES.FIND_BY_ID, [id]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }
  
  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.execute(
      USER_QUERIES.CREATE,
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
    const [rows] = await pool.execute(USER_QUERIES.GET_PENDING);
    return rows as User[];
  }

  static async getAllTeachers(): Promise<User[]> {
    const [rows] = await pool.execute(USER_QUERIES.GET_ALL_TEACHERS);
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
      USER_QUERIES.UPDATE_STATUS,
      [status, id]
    );
    return (result as any).affectedRows > 0;
  }

  static async updatePassword(username: string, password_hash: string): Promise<boolean> {
    const [result] = await pool.execute(
      USER_QUERIES.UPDATE_PASSWORD,
      [password_hash, username]
    );
    return (result as any).affectedRows > 0;
  }
}
