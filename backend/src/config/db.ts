import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL ? 
        (process.env.DB_SSL.startsWith('{') ? JSON.parse(process.env.DB_SSL) : 
        (process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined)) : 
        undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
