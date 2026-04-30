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
    conn.query('SHOW TABLES', (err, rows) => {
        if (err) {
            process.exit(1);
        } else {
            console.log('--- TABLES ---');
            rows.forEach(row => {
                console.log(Object.values(row)[0]);
            });
            console.log('--- END ---');
        }
        conn.end();
        process.exit(0);
    });
});
