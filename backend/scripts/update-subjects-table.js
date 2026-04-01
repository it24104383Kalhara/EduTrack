const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSubjectsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ishani',
    database: process.env.DB_NAME || 'edutrack'
  });
  
  try {
    console.log('🔧 Updating subjects table schema...');
    
    // Check current table structure
    const [columns] = await connection.execute('SHOW COLUMNS FROM subjects');
    console.log('Current columns:', columns.map(col => col.Field));
    
    // Add missing columns if they don't exist
    const hasCategory = columns.some(col => col.Field === 'category');
    const hasIsOptional = columns.some(col => col.Field === 'is_optional');
    
    if (!hasCategory) {
      await connection.execute(`
        ALTER TABLE subjects 
        ADD COLUMN category VARCHAR(100) DEFAULT NULL
      `);
      console.log('✅ Added category column');
    }
    
    if (!hasIsOptional) {
      await connection.execute(`
        ALTER TABLE subjects 
        ADD COLUMN is_optional BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_optional column');
    }
    
    // Check if we need to modify the ID column
    const idColumn = columns.find(col => col.Field === 'id');
    if (idColumn && idColumn.Type.includes('varchar')) {
      console.log('🔄 Converting ID from VARCHAR to INT...');
      
      // First, drop the primary key
      await connection.execute('ALTER TABLE subjects DROP PRIMARY KEY');
      
      // Add a new auto-increment integer ID
      await connection.execute(`
        ALTER TABLE subjects 
        ADD COLUMN id_new INT AUTO_INCREMENT PRIMARY KEY FIRST
      `);
      
      // Drop the old ID column
      await connection.execute('ALTER TABLE subjects DROP COLUMN id');
      
      // Rename the new ID column
      await connection.execute('ALTER TABLE subjects CHANGE id_new id INT AUTO_INCREMENT PRIMARY KEY');
      
      console.log('✅ ID column converted to INT AUTO_INCREMENT');
    }
    
    console.log('✅ Subjects table updated successfully');
    
    // Show final structure
    const [finalColumns] = await connection.execute('SHOW COLUMNS FROM subjects');
    console.log('Final columns:', finalColumns.map(col => `${col.Field} (${col.Type})`));
    
  } catch (error) {
    console.error('❌ Failed to update subjects table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

updateSubjectsTable()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
