const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDuplicateQuery() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: process.env.DB_NAME || 'edutrack'
  });
  
  try {
    console.log('🧪 Testing duplicate query...');
    
    const name = 'IT';
    const grade = '6';
    const gradesJson = JSON.stringify([grade]);
    
    console.log('Testing with params:', { name, gradesJson });
    
    const query = `
      SELECT id, name, code, grades, stream, type, category, is_optional, created_at, updated_at
      FROM subjects
      WHERE LOWER(name) = LOWER(?)
          AND JSON_CONTAINS(grades, ?)
          AND stream IS NULL
    `;
    
    const [rows] = await connection.execute(query, [name, gradesJson]);
    console.log('Query result:', rows);
    
  } catch (error) {
    console.error('❌ Query test failed:', error);
  } finally {
    await connection.end();
  }
}

testDuplicateQuery();
