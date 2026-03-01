const mysql = require('mysql2/promise');

async function sqlFix() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== SQL fix for dates ===');
    
    // Use STR_TO_DATE to convert the timestamp string to proper date
    const [result] = await connection.execute(`
      UPDATE attendance_mark 
      SET marked_date = DATE_FORMAT(STR_TO_DATE(marked_date, '%Y-%m-%dT%H:%i:%s.%fZ'), '%Y-%m-%d')
      WHERE marked_date LIKE '%T%:%:%%'
    `);
    
    console.log(`Updated ${result.affectedRows} records`);
    
    // Check results
    const [rows] = await connection.execute('SELECT marked_date, COUNT(*) as count FROM attendance_mark GROUP BY marked_date ORDER BY marked_date DESC LIMIT 10');
    console.log('Dates after SQL fix:');
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

sqlFix();
