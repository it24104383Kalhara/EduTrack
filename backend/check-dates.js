const mysql = require('mysql2/promise');

async function checkDates() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Checking dates in attendance_mark table ===');
    const [rows] = await connection.execute('SELECT marked_date, COUNT(*) as count FROM attendance_mark GROUP BY marked_date ORDER BY marked_date DESC LIMIT 10');
    console.log('Dates in database:');
    console.table(rows);
    
    console.log('\n=== Recent attendance records ===');
    const [recent] = await connection.execute('SELECT marked_date, marked_time, student_name, grade, section FROM attendance_mark ORDER BY created_at DESC LIMIT 5');
    console.log('Recent records:');
    console.table(recent);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDates();
