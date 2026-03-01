const mysql = require('mysql2/promise');

async function clearBadData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Clearing bad attendance data ===');
    
    // Delete records with timestamp format
    const [result] = await connection.execute(`
      DELETE FROM attendance_mark 
      WHERE marked_date LIKE '%T%:%:%%'
    `);
    
    console.log(`Deleted ${result.affectedRows} bad records`);
    
    // Check remaining data
    const [rows] = await connection.execute('SELECT marked_date, COUNT(*) as count FROM attendance_mark GROUP BY marked_date ORDER BY marked_date DESC LIMIT 10');
    console.log('Remaining dates:');
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearBadData();
