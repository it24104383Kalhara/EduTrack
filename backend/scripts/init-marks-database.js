// ============================================================================
// MARKS DATABASE INITIALIZATION SCRIPT
// ============================================================================
// Purpose: Initialize the marks table and related database structures
// Author: EduTrack Development Team
// ============================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack',
  charset: 'utf8mb4'
};

async function initializeMarksDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} 
                             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${dbConfig.database}`);
    
    console.log('✅ Database connection established');
    
    // Create marks table with all necessary fields
    const createMarksTable = `
      CREATE TABLE IF NOT EXISTS marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id VARCHAR(50) NOT NULL,
        grade_id INT NOT NULL,
        term VARCHAR(50) NOT NULL,
        exam_type ENUM('mid_term', 'final_term', 'assignment', 'quiz', 'practical') NOT NULL,
        marks_obtained DECIMAL(5,2) NOT NULL,
        max_marks DECIMAL(5,2) NOT NULL,
        percentage DECIMAL(5,2) GENERATED ALWAYS AS (marks_obtained / max_marks * 100) STORED,
        grade_obtained ENUM('A', 'B', 'C', 'S', 'F') GENERATED ALWAYS AS (
          CASE 
            WHEN (marks_obtained / max_marks * 100) >= 75 THEN 'A'
            WHEN (marks_obtained / max_marks * 100) >= 65 THEN 'B'
            WHEN (marks_obtained / max_marks * 100) >= 55 THEN 'C'
            WHEN (marks_obtained / max_marks * 100) >= 40 THEN 'S'
            ELSE 'F'
          END
        ) STORED,
        remarks TEXT,
        exam_date DATE NOT NULL,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        
        -- Unique Constraint to prevent duplicate entries
        UNIQUE KEY unique_mark (student_id, subject_id, grade_id, term, exam_type),
        
        -- Performance Indexes
        INDEX idx_student_id (student_id),
        INDEX idx_subject_id (subject_id),
        INDEX idx_grade_id (grade_id),
        INDEX idx_term (term),
        INDEX idx_exam_type (exam_type),
        INDEX idx_exam_date (exam_date),
        INDEX idx_percentage (percentage),
        INDEX idx_grade_obtained (grade_obtained),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    console.log('📋 Creating marks table...');
    await connection.query(createMarksTable);
    console.log('✅ Marks table created successfully');
    
    // Verify table structure
    console.log('🔍 Verifying table structure...');
    const [tableInfo] = await connection.query(`DESCRIBE marks`);
    console.log('📊 Marks table structure:');
    tableInfo.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    // Check if related tables exist
    const [tables1] = await connection.query(`SHOW TABLES LIKE '%students%'`);
    const [tables2] = await connection.query(`SHOW TABLES LIKE '%subjects%'`);
    const [tables3] = await connection.query(`SHOW TABLES LIKE '%grades%'`);
    const allTables = [...tables1, ...tables2, ...tables3];
    const existingTables = allTables.map(row => Object.values(row)[0]);
    
    console.log('📋 Related tables status:');
    console.log(`  - students: ${existingTables.includes('students') ? '✅' : '❌'}`);
    console.log(`  - subjects: ${existingTables.includes('subjects') ? '✅' : '❌'}`);
    console.log(`  - grades: ${existingTables.includes('grades') ? '✅' : '❌'}`);
    
    // Create sample data if tables are empty
    const [markCount] = await connection.query(`SELECT COUNT(*) as count FROM marks`);
    if (markCount[0].count === 0) {
      console.log('📝 No marks found. You can add marks through the API or frontend.');
      console.log('💡 Use the following API endpoints:');
      console.log('   POST /api/marks - Create single mark');
      console.log('   POST /api/marks/bulk - Create multiple marks');
      console.log('   GET /api/marks - View all marks');
    } else {
      console.log(`📊 Found ${markCount[0].count} mark records in the database`);
    }
    
    console.log('\n🎉 Marks database initialization completed successfully!');
    console.log('\n📚 Available CRUD Operations:');
    console.log('   ✅ CREATE - POST /api/marks');
    console.log('   ✅ READ - GET /api/marks/:id');
    console.log('   ✅ UPDATE - PUT /api/marks/:id');
    console.log('   ✅ DELETE - DELETE /api/marks/:id');
    console.log('\n🔍 Additional Query Endpoints:');
    console.log('   📊 GET /api/marks/student/:studentId/grade/:gradeId/term/:term');
    console.log('   📊 GET /api/marks/grade/:gradeId/subject/:subjectId/term/:term');
    console.log('   📊 GET /api/marks/grade/:gradeId/term/:term');
    console.log('   📊 GET /api/marks/result/student/:studentId/grade/:gradeId/term/:term');
    console.log('   📊 GET /api/marks/low-marks/threshold/:threshold');
    console.log('   📊 GET /api/marks/statistics/grade/:gradeId/term/:term');
    
  } catch (error) {
    console.error('❌ Error initializing marks database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the initialization
if (require.main === module) {
  initializeMarksDatabase();
}

module.exports = { initializeMarksDatabase };
