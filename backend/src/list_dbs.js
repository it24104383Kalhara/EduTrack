const mysql = require('mysql2');
require('dotenv').config();

const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
});

conn.connect((err) => {
    if (err) {
        console.log('CONN_ERROR: ' + err.message);
        process.exit(1);
    }
    conn.query('SHOW DATABASES', (err, rows) => {
        if (err) {
            console.log('SHOW_DB_ERROR: ' + err.message);
        } else {
            console.log('--- ALL DATABASES ---');
            rows.forEach(row => console.log(row.Database));
        }
        conn.end();
        process.exit(0);
    });
});
