const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function updateExamTypes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edutrack',
    multipleStatements: true
  });

  try {
    console.log('🔄 Updating exam types...');
    
    // Update existing records to map old exam types to new ones
    await connection.execute(`
      UPDATE marks SET exam_type = 'first' WHERE exam_type = 'mid_term';
    `);
    
    await connection.execute(`
      UPDATE marks SET exam_type = 'second' WHERE exam_type = 'final_term';
    `);
    
    await connection.execute(`
      UPDATE marks SET exam_type = 'third' WHERE exam_type IN ('assignment', 'quiz', 'practical');
    `);
    
    // Now modify the column
    await connection.execute(`
      ALTER TABLE marks MODIFY COLUMN exam_type ENUM('first', 'second', 'third') NOT NULL;
    `);
    
    console.log('✅ Exam types updated successfully!');
    console.log('📊 Mapping:');
    console.log('   mid_term → first');
    console.log('   final_term → second');
    console.log('   assignment/quiz/practical → third');
    
  } catch (error) {
    console.error('❌ Error updating exam types:', error);
  } finally {
    await connection.end();
  }
}

updateExamTypes();
