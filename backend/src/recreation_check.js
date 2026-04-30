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
    if (err) { console.log('CONN_ERROR: ' + err.message); process.exit(1); }
    conn.query('SHOW TABLES', (err, rows) => {
        if (err) { console.log('SHOW_TABLES_ERROR: ' + err.message); }
        else {
            console.log('--- CURRENT TABLES ---');
            rows.forEach(r => console.log(Object.values(r)[0]));
            if (rows.length === 0) console.log('(No tables found)');
        }
        conn.end();
        process.exit(0);
    });
});
