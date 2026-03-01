import pool from './database';

async function testApiEndpoints() {
  try {
    console.log('🔍 Testing API endpoints data...');
    
    // Test students data
    const [students] = await pool.execute('SELECT COUNT(*) as count FROM students');
    console.log('📋 Students in database:', students);
    
    // Test grades data
    const [grades] = await pool.execute('SELECT COUNT(*) as count FROM grades');
    console.log('📋 Grades in database:', grades);
    
    // Test actual student data
    const [studentData] = await pool.execute('SELECT id, first_name, last_name FROM students LIMIT 3');
    console.log('📋 Sample students:', studentData);
    
    // Test actual grade data
    const [gradeData] = await pool.execute('SELECT id, name, level FROM grades LIMIT 3');
    console.log('📋 Sample grades:', gradeData);
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error);
  } finally {
    await pool.end();
  }
}

testApiEndpoints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
