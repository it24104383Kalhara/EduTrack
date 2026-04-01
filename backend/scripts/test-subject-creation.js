const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSubjectCreation() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: process.env.DB_NAME || 'edutrack'
  });
  
  try {
    console.log('🧪 Testing full subject creation process...');
    
    // Test data
    const subjectData = {
      name: 'IT',
      code: 'IT',
      grades: ['6', '7'],
      stream: undefined,
      type: '6-11',
      category: 'Category 1',
      is_optional: true
    };
    
    console.log('1. Testing duplicate check for each grade...');
    
    for (const grade of subjectData.grades) {
      console.log(`Checking grade: ${grade}`);
      
      if (subjectData.stream && Array.isArray(subjectData.stream) && subjectData.stream.length > 0) {
        // This path shouldn't be taken since stream is undefined
        console.log('Stream path - should not execute');
      } else {
        // This is the path that should be taken
        const checkStream = (Array.isArray(subjectData.stream) && subjectData.stream.length === 0) ? undefined : subjectData.stream;
        console.log('Using checkStream:', checkStream);
        
        const query = `
          SELECT id, name, code, grades, stream, type, category, is_optional, created_at, updated_at
          FROM subjects
          WHERE LOWER(name) = LOWER(?)
              AND JSON_CONTAINS(grades, ?)
              AND stream IS NULL
        `;
        
        const params = [subjectData.name, JSON.stringify([grade])];
        console.log('Query params:', params);
        
        const [rows] = await connection.execute(query, params);
        console.log(`Duplicate check result for grade ${grade}:`, rows.length);
        
        if (rows.length > 0) {
          console.log('Found duplicate, would return error');
          return;
        }
      }
    }
    
    console.log('2. No duplicates found, proceeding with creation...');
    
    const streamValue = subjectData.stream && Array.isArray(subjectData.stream) && subjectData.stream.length > 0 
      ? JSON.stringify(subjectData.stream) 
      : (subjectData.stream && !Array.isArray(subjectData.stream) ? JSON.stringify([subjectData.stream]) : null);
    
    console.log('Stream value:', streamValue);
    
    const [result] = await connection.execute(
      'INSERT INTO subjects (name, code, grades, stream, type, category, is_optional) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        subjectData.name,
        subjectData.code,
        JSON.stringify(subjectData.grades),
        streamValue,
        subjectData.type,
        subjectData.category || null,
        subjectData.is_optional ? 1 : 0
      ]
    );
    
    console.log('✅ Subject created successfully with ID:', result.insertId);
    
    // Clean up
    await connection.execute('DELETE FROM subjects WHERE id = ?', [result.insertId]);
    console.log('🧹 Test subject cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await connection.end();
  }
}

testSubjectCreation();
