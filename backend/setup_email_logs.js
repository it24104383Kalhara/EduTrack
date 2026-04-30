const mysql = require('mysql2');
require('dotenv').config();

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conn.query('DROP TABLE IF EXISTS sent_emails', (err) => {
    if (err) console.log('Drop error:', err.message);

    const createSQL = `CREATE TABLE IF NOT EXISTS email_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT,
        parent_email VARCHAR(100) NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT,
        status VARCHAR(20) DEFAULT 'sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    conn.query(createSQL, (err) => {
        if (err) {
            console.log('Create error:', err.message);
        } else {
            console.log('email_logs table created successfully!');
        }
        conn.query('DESCRIBE email_logs', (err, rows) => {
            console.log(JSON.stringify(rows, null, 2));
            conn.end();
        });
    });
});
