const mysql = require('mysql2/promise');
require('dotenv').config();

async function testEmptyDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack'
  });

  try {
    console.log('🔍 Testing Empty Database APIs...\n');
    
    // Test database connection
    console.log('1. Testing database connection...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Connected. Found ${tables.length} tables\n`);
    
    // Test student API with empty database
    console.log('2. Testing Student API...');
    try {
      const studentResponse = await fetch('http://localhost:5000/api/students');
      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        console.log(`✅ Student API: ${studentData.data?.length || 0} students`);
        console.log(`   Message: ${studentData.message}`);
      } else {
        console.log(`❌ Student API failed: ${studentResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Student API error: ${error.message}`);
    }
    
    // Test grades API with empty database
    console.log('\n3. Testing Grades API...');
    try {
      const gradesResponse = await fetch('http://localhost:5000/api/grades');
      if (gradesResponse.ok) {
        const gradesData = await gradesResponse.json();
        console.log(`✅ Grades API: ${gradesData.data?.length || 0} grades`);
        console.log(`   Message: ${gradesData.message}`);
      } else {
        console.log(`❌ Grades API failed: ${gradesResponse.status}`);
        const errorText = await gradesResponse.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Grades API error: ${error.message}`);
    }
    
    // Test assignments API with empty database
    console.log('\n4. Testing Assignments API...');
    try {
      const assignmentsResponse = await fetch('http://localhost:5000/api/grades/assignments');
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        console.log(`✅ Assignments API: ${assignmentsData.data?.length || 0} assignments`);
        console.log(`   Message: ${assignmentsData.message}`);
      } else {
        console.log(`❌ Assignments API failed: ${assignmentsResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Assignments API error: ${error.message}`);
    }
    
    // Test subjects API with empty database
    console.log('\n5. Testing Subjects API...');
    try {
      const subjectsResponse = await fetch('http://localhost:5000/api/subjects');
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        console.log(`✅ Subjects API: ${subjectsData.data?.length || 0} subjects`);
        console.log(`   Message: ${subjectsData.message}`);
      } else {
        console.log(`❌ Subjects API failed: ${subjectsResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Subjects API error: ${error.message}`);
    }
    
    console.log('\n💡 If APIs are working, the issue might be in frontend error handling.');
    console.log('   Empty database should return empty arrays, not errors.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await connection.end();
  }
}

testEmptyDatabase();
