const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'ishani',
  database: 'edutrack'
};

async function debugSubject() {
  try {
    const conn = await mysql.createConnection(config);
    console.log('✅ Database connection successful');
    
    // Check current subjects
    const [subjects] = await conn.query('SELECT * FROM subjects');
    console.log('📚 Current subjects:', subjects.length);
    if (subjects.length > 0) {
      console.log('Sample subject:', subjects[0]);
    }
    
    // Try to insert a test subject
    try {
      const testSubject = {
        id: 'TEST_' + Date.now(),
        name: 'Test Subject',
        code: 'TST001',
        grades: JSON.stringify(['6', '7']),
        stream: null,
        type: '6-11'
      };
      
      const [result] = await conn.query(
        'INSERT INTO subjects (id, name, code, grades, stream, type) VALUES (?, ?, ?, ?, ?, ?)',
        [testSubject.id, testSubject.name, testSubject.code, testSubject.grades, testSubject.stream, testSubject.type]
      );
      
      console.log('✅ Manual insert successful, insertId:', result.insertId);
      
      // Verify the insert
      const [newSubjects] = await conn.query('SELECT * FROM subjects WHERE id = ?', [testSubject.id]);
      console.log('📋 New subject:', newSubjects[0]);
      
    } catch (insertErr) {
      console.log('❌ Manual insert failed:', insertErr.message);
      console.log('❌ Error details:', insertErr);
    }
    
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    process.exit(1);
  }
}

debugSubject();
