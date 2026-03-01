const mysql = require('mysql2/promise');

async function fixDates() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Fixing dates in attendance_mark table ===');
    
    // Update all records that have timestamp format to date format
    const [result] = await connection.execute(`
      UPDATE attendance_mark 
      SET marked_date = DATE(marked_date)
      WHERE marked_date LIKE '%T%:%:%%'
    `);
    
    console.log(`Updated ${result.affectedRows} records`);
    
    // Check the results
    const [rows] = await connection.execute('SELECT marked_date, COUNT(*) as count FROM attendance_mark GROUP BY marked_date ORDER BY marked_date DESC LIMIT 10');
    console.log('Dates after fix:');
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixDates();
