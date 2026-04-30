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
    conn.query('SHOW TABLES', (err, rows) => {
        if (err) { process.exit(1); }
        let tables = rows.map(r => Object.values(r)[0]);
        let completed = 0;
        
        tables.forEach(table => {
            conn.query(`DESCRIBE \`${table}\``, (err, columns) => {
                console.log(`\nTable: ${table}`);
                if (err) {
                    console.log(`  ERROR: ${err.message}`);
                } else {
                    columns.forEach(col => {
                        console.log(`  Column: ${col.Field}`);
                    });
                }
                completed++;
                if (completed === tables.length) {
                    conn.end();
                    process.exit(0);
                }
            });
        });
    });
});
