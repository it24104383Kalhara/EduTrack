const mysql = require('mysql2/promise');

async function directDelete() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Direct delete of bad record ===');
    
    // Delete the specific bad record
    const [result] = await connection.execute(`
      DELETE FROM attendance_mark 
      WHERE marked_date = '2026-02-28T18:30:00.000Z'
    `);
    
    console.log(`Deleted ${result.affectedRows} records`);
    
    // Check remaining data
    const [rows] = await connection.execute('SELECT marked_date, COUNT(*) as count FROM attendance_mark GROUP BY marked_date ORDER BY marked_date DESC LIMIT 10');
    console.log('Remaining dates:');
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

directDelete();
