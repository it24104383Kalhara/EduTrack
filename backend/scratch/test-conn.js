const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    console.log('Target Host:', process.env.DB_HOST);
    console.log('Target Port:', process.env.DB_PORT);
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        });
        console.log('Success!');
        await connection.end();
    } catch (err) {
        console.error('FAILED TO CONNECT:');
        console.error(err);
    }
}

test();
