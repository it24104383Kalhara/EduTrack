import pool from './database';

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Checking database connection and data...');
    
    // Check current database
    const [dbInfo] = await pool.execute('SELECT DATABASE() as current_db');
    console.log('📋 Current database:', dbInfo);
    
    // Check table exists
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 Tables in database:', tables);
    
    // Check students table count
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM students');
    console.log('📋 Total students in database:', count);
    
    // Check if students table has data
    const [students] = await pool.execute('SELECT id, first_name, last_name FROM students LIMIT 5');
    console.log('📋 Sample student data:');
    console.table(students);
    
    // Check if updated_at column exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'updated_at'
    `);
    console.log('📋 updated_at column exists:', Array.isArray(columns) && columns.length > 0 ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
