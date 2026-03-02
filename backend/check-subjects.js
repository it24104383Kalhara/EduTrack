const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'ishani',
  database: 'edutrack'
};

async function checkSubjects() {
  try {
    const conn = await mysql.createConnection(config);
    
    const [subjects] = await conn.query('SELECT * FROM subjects ORDER BY created_at DESC');
    
    console.log('📚 All subjects in database:');
    if (subjects.length === 0) {
      console.log('   No subjects found');
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

checkSubjects();
