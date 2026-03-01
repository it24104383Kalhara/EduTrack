import pool from './database';

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to students table...');
    
    // Add ethnicity column if it doesn't exist
    try {
      await pool.execute("ALTER TABLE students ADD COLUMN ethnicity VARCHAR(50) NOT NULL DEFAULT ''");
      console.log('✅ ethnicity column added');
    } catch (error) {
      console.log('ℹ️ ethnicity column already exists');
    }
    
    // Add parent_ethnicity column if it doesn't exist
    try {
      await pool.execute("ALTER TABLE students ADD COLUMN parent_ethnicity VARCHAR(50) NOT NULL DEFAULT ''");
      console.log('✅ parent_ethnicity column added');
    } catch (error) {
      console.log('ℹ️ parent_ethnicity column already exists');
    }
    
    console.log('🎉 Database schema update completed!');
    
  } catch (error) {
    console.error('❌ Error adding missing columns:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update
addMissingColumns()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
