const mysql = require('mysql2/promise');

async function checkNewRecords() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Check for new attendance records ===');
    
    // Get all records sorted by creation time
    const [rows] = await connection.execute('SELECT id, marked_date, created_at FROM attendance_mark ORDER BY created_at DESC');
    
    console.log('All attendance records:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, marked_date: ${row.marked_date}, created_at: ${row.created_at}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkNewRecords();
