const mysql = require('mysql2/promise');

async function debugAttendance() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Debug attendance data ===');
    
    // Get the latest record
    const [rows] = await connection.execute('SELECT * FROM attendance_mark ORDER BY created_at DESC LIMIT 1');
    
    if (rows.length > 0) {
      console.log('Latest attendance record:');
      console.table(rows[0]);
      
      console.log('\nDate details:');
      console.log('marked_date type:', typeof rows[0].marked_date);
      console.log('marked_date value:', rows[0].marked_date);
      console.log('created_at type:', typeof rows[0].created_at);
      console.log('created_at value:', rows[0].created_at);
    } else {
      console.log('No attendance records found');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugAttendance();
