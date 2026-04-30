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
    if (err) { process.exit(1); }
    conn.query(`RENAME TABLE email_logs TO email_logs_old`, (err) => {
        if (err) {
            console.log('RENAME_ERROR: ' + err.message);
        } else {
            console.log('Successfully renamed email_logs to email_logs_old. Restarting app will recreate it correctly.');
        }
        conn.end();
        process.exit(0);
    });
});
