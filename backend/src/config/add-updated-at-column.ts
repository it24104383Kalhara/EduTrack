import pool from './database';

async function addUpdatedAtColumn() {
  try {
    console.log('🔧 Adding updated_at column to students table...');
    
    // Add updated_at column if it doesn't exist
    try {
      await pool.execute("ALTER TABLE students ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      console.log('✅ updated_at column added successfully');
    } catch (error) {
      console.log('ℹ️ updated_at column already exists');
    }
    
    console.log('🎉 Database schema update completed!');
    
  } catch (error) {
    console.error('❌ Error adding updated_at column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update
addUpdatedAtColumn()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
