const mysql = require('mysql2');
require('dotenv').config();

const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: 'edutrack_hostel'
});

conn.connect((err) => {
    if (err) {
        console.log('CONN_ERROR: ' + err.message);
        process.exit(1);
    }
    conn.query('SHOW TABLES', (err, rows) => {
        if (err) {
            console.log('SHOW_TABLE_ERROR: ' + err.message);
        } else {
            console.log('Tables in edutrack_hostel:');
            console.log(rows);
        }
        conn.end();
        process.exit(0);
    });
});
