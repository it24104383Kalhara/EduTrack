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
        console.log('CONN_ERROR: ' + err.message);
        process.exit(1);
    }
    conn.query('DESCRIBE email_logs', (err, rows) => {
        if (err) {
            console.log('DESCRIBE_ERROR: ' + err.message);
        } else {
            console.log('---START_COLUMNS---');
            rows.forEach(row => {
                console.log(row.Field);
            });
            console.log('---END_COLUMNS---');
        }
        conn.end();
        process.exit(0);
    });
});
