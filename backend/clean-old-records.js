const mysql = require('mysql2/promise');

async function cleanOldRecords() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Clean old corrupted records ===');
    
    // Delete records with timestamp format (old corrupted data)
    const [result] = await connection.execute(`
      DELETE FROM attendance_mark 
      WHERE marked_date LIKE '%T%:%:%%Z'
    `);
    
    console.log(`Deleted ${result.affectedRows} corrupted records`);
    
    // Check remaining records
    const [rows] = await connection.execute('SELECT id, marked_date, created_at FROM attendance_mark ORDER BY created_at DESC');
    
    console.log('\nRemaining records:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, marked_date: ${row.marked_date}, created_at: ${row.created_at}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanOldRecords();
