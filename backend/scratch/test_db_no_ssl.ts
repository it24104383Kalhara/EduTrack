
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnectionNoSSL() {
    console.log('Attempting to connect WITHOUT SSL...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: undefined
        });

        console.log('Connected WITHOUT SSL (unexpected!).');
        await connection.end();
    } catch (err: any) {
        console.error('Error connecting WITHOUT SSL:', err.code, err.message);
    }
}

testConnectionNoSSL();
