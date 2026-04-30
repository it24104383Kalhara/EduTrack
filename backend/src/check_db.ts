import mysql from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack_v2'
});

conn.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        process.exit(1);
    }
    conn.query('DESCRIBE email_logs', (err, rows: any) => {
        if (err) {
            console.error('Error describing table:', err.message);
        } else {
            console.log('Structure of email_logs table:');
            console.table(rows);
        }
        conn.end();
        process.exit(0);
    });
});
