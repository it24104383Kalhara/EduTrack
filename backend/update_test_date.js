const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Update the latest pending payment to be due in 5 days (April 7th, 2026)
connection.query("UPDATE payments SET due_date = '2026-04-07' WHERE status = 'pending' LIMIT 1", (err, result) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Updated 1 payment for testing!");
        console.log("Affected Rows:", result.affectedRows);
    }
    connection.end();
});
