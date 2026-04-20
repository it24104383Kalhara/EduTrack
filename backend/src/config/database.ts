import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Master Database Configuration
 * Supports both local and hosted (SSL) connections
 */
const dbConfig: mysql.PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edutrack',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    timezone: 'local',
    dateStrings: true,
    ssl: (process.env.DB_SSL === 'true' || (process.env.DB_SSL && process.env.DB_SSL.includes('rejectUnauthorized'))) ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : undefined
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test the database connection
 */
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};

export default pool;
