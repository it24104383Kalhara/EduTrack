
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
    console.log('Attempting to connect with:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL
    });

    try {
        const sslValue = process.env.DB_SSL;
        const sslOptions = sslValue ? 
            (sslValue.startsWith('{') ? JSON.parse(sslValue) : 
            (sslValue === 'true' ? { rejectUnauthorized: true } : undefined)) : 
            undefined;

        console.log('Using SSL Options:', sslOptions);

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: sslOptions
        });

        console.log('Successfully connected to the database.');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables in database:', tables);

        for (const tableRow of tables as any[]) {
            const tableName = Object.values(tableRow)[0] as string;
            const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            console.log(`Table ${tableName} has ${(count as any)[0].count} rows.`);
        }

        await connection.end();
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
}

testConnection();
