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
        let emailsTables = tables.filter(t => t.toLowerCase().includes('email'));
        
        let completed = 0;
        if (emailsTables.length === 0) { conn.end(); process.exit(0); }
        
        emailsTables.forEach(table => {
            conn.query(`DROP TABLE \`${table}\``, (err) => {
                if (err) {
                    console.log(`Error dropping ${table}: ${err.message}`);
                } else {
                    console.log(`Successfully dropped ${table}`);
                }
                completed++;
                if (completed === emailsTables.length) {
                    conn.end();
                    process.exit(0);
                }
            });
        });
    });
});
