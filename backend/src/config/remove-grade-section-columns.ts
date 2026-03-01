import pool from './database';

async function removeGradeAndSectionColumns() {
  try {
    console.log('🔧 Removing grade and section columns from students table...');
    
    // Check if columns exist first
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'students' 
      AND COLUMN_NAME IN ('grade', 'section')
    `);
    
    if (Array.isArray(columns) && columns.length > 0) {
      console.log('Found columns to remove:', columns);
      
      // Remove grade column if it exists
      if ((columns as any[]).some(col => col.COLUMN_NAME === 'grade')) {
        await pool.execute('ALTER TABLE students DROP COLUMN grade');
        console.log('✅ Grade column removed');
      }
      
      // Remove section column if it exists
      if ((columns as any[]).some(col => col.COLUMN_NAME === 'section')) {
        await pool.execute('ALTER TABLE students DROP COLUMN section');
        console.log('✅ Section column removed');
      }
    } else {
      console.log('ℹ️ Grade and section columns do not exist in students table');
    }
    
    console.log('🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing columns:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
removeGradeAndSectionColumns()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
