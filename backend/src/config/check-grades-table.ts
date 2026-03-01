import pool from './database';

async function checkGradesTable() {
  try {
    console.log('🔍 Checking grades table structure...');
    
    // Check table structure
    const [structure] = await pool.execute('DESCRIBE grades');
    console.log('📋 Grades table structure:');
    console.table(structure);
    
    // Check actual data
    const [data] = await pool.execute('SELECT * FROM grades LIMIT 3');
    console.log('📋 Sample grades data:');
    console.table(data);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkGradesTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
