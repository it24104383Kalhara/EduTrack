import pool from './database';

async function checkTableColumns() {
  try {
    console.log('🔍 Checking students table columns...');
    
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'students'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Students table structure:');
    console.table(columns);
    
  } catch (error) {
    console.error('❌ Error checking table columns:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the check
checkTableColumns()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
