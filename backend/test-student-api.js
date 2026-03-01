const mysql = require('mysql2/promise');
require('dotenv').config();

async function testStudentAPI() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack'
  });

  try {
    console.log('🔍 Testing Student API Response...\n');
    
    // Test what the student API should return
    console.log('📚 Students Table (what student API returns):');
    const [students] = await connection.execute('SELECT * FROM students');
    console.table(students);
    console.log(`Total students in database: ${students.length}\n`);
    
    // Test the API endpoint directly
    console.log('🌐 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:5000/api/students');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', data);
        console.log(`📊 API returned ${data.data?.length || 0} students`);
      } else {
        console.log('❌ API Error:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.log('❌ API Connection Error:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing student API:', error);
  } finally {
    await connection.end();
  }
}

testStudentAPI();
