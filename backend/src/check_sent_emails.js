const mysql = require('mysql2');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'edutrack_v2';
const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: dbName
});

conn.connect((err) => {
    if (err) {
        process.exit(1);
    }
    conn.query('DESCRIBE sent_emails', (err, rows) => {
        if (err) {
            console.log('DESCRIBE sent_emails FAILED');
        } else {
            console.log('--- SENT_EMAILS COLUMNS ---');
            rows.forEach(row => console.log(row.Field));
            console.log('--- END ---');
        }
        conn.end();
        process.exit(0);
    });
});
