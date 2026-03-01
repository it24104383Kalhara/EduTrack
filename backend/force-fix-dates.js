const mysql = require('mysql2/promise');

async function forceFixDates() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Force fixing dates ===');
    
    // Get all records
    const [records] = await connection.execute('SELECT id, marked_date FROM attendance_mark');
    console.log('Total records:', records.length);
    
    for (const record of records) {
      console.log('Processing:', record.marked_date);
      
      // Convert timestamp string to date
      const date = new Date(record.marked_date);
      const localDate = date.toLocaleDateString('en-CA'); // Local timezone YYYY-MM-DD
      
      console.log(`Converting: ${record.marked_date} -> ${localDate}`);
      
      // Update with proper date format
      await connection.execute(
        'UPDATE attendance_mark SET marked_date = ? WHERE id = ?',
        [localDate, record.id]
      );
    }
    
    // Check results
    const [rows] = await connection.execute('SELECT marked_date, COUNT(*) as count FROM attendance_mark GROUP BY marked_date ORDER BY marked_date DESC LIMIT 10');
    console.log('\nDates after force fix:');
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

forceFixDates();
