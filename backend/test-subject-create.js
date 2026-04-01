const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCreateSubject() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: 'edutrack'
  });

  try {
    const data = {
        name: 'Test IT',
        code: 'TEST_IT',
        grades: JSON.stringify(['6','7']),
        stream: null,
        type: '6-11',
        category: 'Category 1',
        is_optional: 1
    };

    console.log('--- Attempting to create subject ---');
    const [result] = await connection.execute(
        'INSERT INTO subjects (name, code, grades, stream, type, category, is_optional) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.name, data.code, data.grades, data.stream, data.type, data.category, data.is_optional]
    );
    console.log('✅ Success! Result:', result);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testCreateSubject();
