import pool from './database';

async function detailedCheck() {
  try {
    console.log('🔍 Detailed check of updated_at column...');
    
    // Check if column exists and has data
    const [columnInfo] = await pool.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'updated_at'
    `);
    
    console.log('📋 Column info for updated_at:');
    console.table(columnInfo);
    
    // Check actual data in the column
    const [data] = await pool.execute(`
      SELECT 
        id, 
        first_name, 
        last_name,
        CASE 
          WHEN updated_at IS NULL THEN 'NULL'
          ELSE updated_at
        END as updated_at_value,
        LENGTH(updated_at) as updated_at_length
      FROM students 
      ORDER BY id 
      LIMIT 3
    `);
    
    console.log('\n📋 Data in updated_at column:');
    console.table(data);
    
    // Force an update to test
    console.log('\n🧪 Forcing an update to test updated_at...');
    await pool.execute(`
      UPDATE students 
      SET first_name = CONCAT(first_name, '_test') 
      WHERE id = (SELECT MIN(id) FROM students)
    `);
    
    // Check again
    const [afterUpdate] = await pool.execute(`
      SELECT id, first_name, updated_at 
      FROM students 
      WHERE id = (SELECT MIN(id) FROM students)
    `);
    
    console.log('📋 After forced update:');
    console.table(afterUpdate);
    
    // Revert the change
    await pool.execute(`
      UPDATE students 
      SET first_name = REPLACE(first_name, '_test', '') 
      WHERE first_name LIKE '%_test%'
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

detailedCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
