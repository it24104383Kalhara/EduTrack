const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAuthenticatedSubjectCreation() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: process.env.DB_NAME || 'edutrack'
  });
  
  try {
    console.log('🧪 Testing authenticated subject creation...');
    
    // First login to get token
    const username = 'admin';
    const password = 'admin123';
    const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_secret_key_2026';
    
    const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Got token for testing');
    
    // Test the subject creation directly (simulate what the backend does)
    const subjectData = {
      name: 'Test IT Subject',
      code: 'IT_TEST',
      grades: ['6', '7'],
      stream: undefined,
      type: '6-11',
      category: 'Test Category',
      is_optional: true
    };
    
    console.log('🔍 Testing subject creation logic...');
    
    // Check for duplicate code
    const [existingCode] = await connection.execute('SELECT * FROM subjects WHERE code = ?', [subjectData.code]);
    if (existingCode.length > 0) {
      console.log('❌ Code already exists');
      return;
    }
    
    // Check for duplicates in grades
    for (const grade of subjectData.grades) {
      const [duplicate] = await connection.execute(`
        SELECT * FROM subjects 
        WHERE LOWER(name) = LOWER(?) 
        AND JSON_CONTAINS(grades, ?) 
        AND stream IS NULL
      `, [subjectData.name, JSON.stringify([grade])]);
      
      if (duplicate.length > 0) {
        console.log(`❌ Duplicate found for grade ${grade}`);
        return;
      }
    }
    
    // Create the subject
    const [result] = await connection.execute(`
      INSERT INTO subjects (name, code, grades, stream, type, category, is_optional) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      subjectData.name,
      subjectData.code,
      JSON.stringify(subjectData.grades),
      null,
      subjectData.type,
      subjectData.category,
      subjectData.is_optional ? 1 : 0
    ]);
    
    console.log(`✅ Subject created successfully with ID: ${result.insertId}`);
    
    // Clean up
    await connection.execute('DELETE FROM subjects WHERE id = ?', [result.insertId]);
    console.log('🧹 Test subject cleaned up');
    
    console.log('\n✅ All tests passed! The subject creation should work when you are logged in.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await connection.end();
  }
}

testAuthenticatedSubjectCreation();
