import pool from './database';

async function fixDatabaseViewer() {
  try {
    console.log('🔧 Creating a view that includes updated_at column...');
    
    // Create a view that includes all columns including updated_at
    await pool.execute(`
      CREATE OR REPLACE VIEW students_full AS
      SELECT 
        id, 
        first_name, 
        last_name, 
        date_of_birth, 
        gender, 
        religion, 
        address,
        nationality, 
        parent_type, 
        parent_name, 
        parent_phone, 
        parent_address,
        parent_gender, 
        parent_email, 
        parent_religion, 
        parent_nationality, 
        created_at, 
        ethnicity, 
        parent_ethnicity,
        updated_at
      FROM students
    `);
    
    console.log('✅ Created view "students_full" that includes updated_at');
    
    // Test the view
    const [test] = await pool.execute('SELECT * FROM students_full LIMIT 3');
    console.log('📋 Test data from view:');
    console.table(test);
    
    console.log('\n🎯 Now use this query in your database viewer:');
    console.log('SELECT * FROM students_full LIMIT 1000;');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixDatabaseViewer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
