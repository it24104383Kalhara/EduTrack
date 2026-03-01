const mysql = require('mysql2/promise');
require('dotenv').config();

async function deleteStudentAssignmentsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack'
  });

  try {
    console.log('🗑️  Deleting student_assignments table...');
    
    // Drop the student_assignments table
    const dropQuery = 'DROP TABLE IF EXISTS student_assignments';
    await connection.execute(dropQuery);
    
    console.log('✅ student_assignments table deleted successfully!');
    
    // Verify the table is deleted
    const [tables] = await connection.execute('SHOW TABLES LIKE "student_assignments"');
    if (tables.length === 0) {
      console.log('✅ Verification: student_assignments table no longer exists');
    } else {
      console.log('⚠️  Warning: Table still exists');
    }
    
  } catch (error) {
    console.error('❌ Error deleting student_assignments table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

deleteStudentAssignmentsTable().catch(console.error);
