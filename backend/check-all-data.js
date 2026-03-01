const mysql = require('mysql2/promise');

async function checkAllData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Check all attendance data ===');
    
    // Get all records with their actual values
    const [rows] = await connection.execute('SELECT id, marked_date, DATE(marked_date) as date_only, created_at FROM attendance_mark ORDER BY created_at DESC');
    
    console.log('All attendance records:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   marked_date (raw): ${row.marked_date}`);
      console.log(`   date_only (DATE()): ${row.date_only}`);
      console.log(`   created_at: ${row.created_at}`);
      console.log('');
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllData();
