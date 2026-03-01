const mysql = require('mysql2/promise');

async function convertDates() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ishani',
      database: 'edutrack'
    });
    
    console.log('=== Converting timestamp dates to proper dates ===');
    
    // Get current bad data
    const [badData] = await connection.execute('SELECT id, marked_date FROM attendance_mark WHERE marked_date LIKE "%T%:%:%%"');
    console.log('Found bad records:', badData.length);
    
    // Update each record
    for (const record of badData) {
      const timestamp = new Date(record.marked_date);
      const properDate = timestamp.toLocaleDateString('en-CA'); // Local timezone YYYY-MM-DD
      
      await connection.execute(
        'UPDATE attendance_mark SET marked_date = ? WHERE id = ?',
        [properDate, record.id]
      );
      
      console.log(`Updated record ${record.id}: ${record.marked_date} -> ${properDate}`);
    }
    
    // Check results
    const [rows] = await connection.execute('SELECT marked_date, COUNT(*) as count FROM attendance_mark GROUP BY marked_date ORDER BY marked_date DESC LIMIT 10');
    console.log('\nDates after conversion:');
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

convertDates();
