import pool from './database';

async function removeUpdatedAtColumn() {
  try {
    console.log('🔧 Removing updated_at column from students table...');
    
    // Check if updated_at column exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'updated_at'
    `);
    
    if (Array.isArray(columns) && columns.length > 0) {
      console.log('Found updated_at column, removing it...');
      await pool.execute('ALTER TABLE students DROP COLUMN updated_at');
      console.log('✅ updated_at column removed successfully');
    } else {
      console.log('ℹ️ updated_at column does not exist');
    }
    
    console.log('🎉 Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error removing updated_at column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
removeUpdatedAtColumn()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
