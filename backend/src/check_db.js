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
    conn.query('DESCRIBE email_logs', (err, rows) => {
        if (err) {
            console.log('Error: ' + err.message);
        } else {
            console.log('--- TABLE STRUCTURE ---');
            rows.forEach(row => {
                console.log(`Column: ${row.Field} | Type: ${row.Type}`);
            });
        }
        conn.end();
        process.exit(0);
    });
});
