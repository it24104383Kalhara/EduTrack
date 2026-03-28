import * as mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'local', // Use local timezone
  dateStrings: true // Return dates as strings instead of Date objects
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

export default pool;
