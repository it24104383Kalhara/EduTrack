import pool from '../config/database';
import { SCHEMA_QUERIES } from './DatabaseQueries';

export class DatabaseSchema {
  static async initializeDatabase(): Promise<void> {
    try {
      console.log('🔄 Initializing centralized database schema...');

      // Ensure database exists and is selected
      // Note: Use .query() instead of .execute() for database management commands
      await pool.query(SCHEMA_QUERIES.CREATE_DB);
      await pool.query(SCHEMA_QUERIES.USE_DB);

      // Create tables in dependency order
      await pool.query(SCHEMA_QUERIES.TABLES.USERS);
      await pool.query(SCHEMA_QUERIES.TABLES.TEACHERS);
      await pool.query(SCHEMA_QUERIES.TABLES.STUDENTS);
      await pool.query(SCHEMA_QUERIES.TABLES.GRADES);
      await pool.query(SCHEMA_QUERIES.TABLES.SUBJECTS);
      await pool.query(SCHEMA_QUERIES.TABLES.STUDENT_ASSIGNMENT);
      await pool.query(SCHEMA_QUERIES.TABLES.STUDENT_SUBJECTS);
      await pool.query(SCHEMA_QUERIES.TABLES.ATTENDANCE_MARK);
      await pool.query(SCHEMA_QUERIES.TABLES.MARKS);
      await pool.query(SCHEMA_QUERIES.TABLES.EMAIL_LOGS);

      // Sports & Extra-curricular Tables
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_ACTIVITIES);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_MEMBERSHIPS);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_INVENTORY);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_INVENTORY_LOGS);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_FACILITIES);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_BOOKINGS);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_PRACTICE_SESSIONS);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_ATTENDANCE);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_ACHIEVEMENTS);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_ATTENDANCE_REPORTS);
      await pool.query(SCHEMA_QUERIES.TABLES.SPORTS_TEACHER_NOTIFICATIONS);

      console.log('✅ Database initialized successfully with centralized schema');
    } catch (error) {
      console.error('❌ Error initializing database schema:', error);
      throw error;
    }
  }
}
