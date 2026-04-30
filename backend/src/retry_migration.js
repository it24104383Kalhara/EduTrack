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
    const queries = [
        `ALTER TABLE email_logs DROP COLUMN subject`,
        `ALTER TABLE email_logs DROP COLUMN message`
    ];

    let results = [];
    let completed = 0;
    
    queries.forEach(q => {
        conn.query(q, (err) => {
            if (err) {
                results.push(`FAILED: ${q} | Error: ${err.message}`);
            } else {
                results.push(`SUCCESS: ${q}`);
            }
            completed++;
            if (completed === queries.length) {
                console.log('--- RESULTS ---');
                results.forEach(r => console.log(r));
                conn.end();
                process.exit(0);
            }
        });
    });
});
