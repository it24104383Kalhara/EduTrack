const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'ishani',
  database: 'edutrack'
};

async function clearTestData() {
  try {
    const conn = await mysql.createConnection(config);
    
    // Remove test subjects
    const [result] = await conn.query('DELETE FROM subjects WHERE code LIKE "TST%" OR code LIKE "TEST%" OR name LIKE "%Test%"');
    
    console.log(`🗑️ Cleared ${result.affectedRows} test subjects`);
    
    // Show remaining subjects
    const [subjects] = await conn.query('SELECT * FROM subjects ORDER BY created_at DESC');
    
    console.log('📚 Remaining subjects in database:');
    if (subjects.length === 0) {
      console.log('   No subjects found - database is clean');
    } else {
      subjects.forEach((s, i) => {
        console.log(`${i+1}. ${s.name} (${s.code}) - Type: ${s.type}, Grades: ${JSON.stringify(s.grades)}`);
      });
    }
    
    await conn.end();
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

clearTestData();
