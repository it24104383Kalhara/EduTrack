import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  waitForConnections?: boolean;
  connectionLimit?: number;
  queueLimit?: number;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack_hostel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

class MySQLDatabase {
  private pool: mysql.Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = mysql.createPool(config);
  }

  async connect(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL connected successfully');
      console.log(`📊 Connected to database: ${config.database}`);
      connection.release();
      this.isConnected = true;
    } catch (error) {
      console.error('❌ MySQL connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      console.log('✅ MySQL disconnected successfully');
      this.isConnected = false;
    } catch (error) {
      console.error('❌ MySQL disconnection failed:', error);
      throw error;
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('❌ MySQL query failed:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  getPool(): mysql.Pool {
    return this.pool;
  }
}

export const db = new MySQLDatabase();
export default db;
