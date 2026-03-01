const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Checking attendance_mark table schema ===');
    const [rows] = await connection.execute('DESCRIBE attendance_mark');
    console.log('Table schema:');
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
