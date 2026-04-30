const mysql = require('mysql2');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'edutrack_v2';
const conn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'navodya@2004'
});

const q = `CREATE TABLE IF NOT EXISTS \`${dbName}\`.email_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    parent_email VARCHAR(100) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

conn.query(q, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Successfully recreated email_logs table.');
    }
    conn.end();
    process.exit(0);
});
