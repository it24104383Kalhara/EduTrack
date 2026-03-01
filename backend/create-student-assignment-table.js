const mysql = require('mysql2/promise');
require('dotenv').config();

async function createStudentAssignmentTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edutrack'
  });

  try {
    console.log('📝 Creating student_assignment table...');
    
    // Create the student_assignment table with specified columns
    const createQuery = `
      CREATE TABLE student_assignment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        grade INT NOT NULL,
        section VARCHAR(50) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_grade_section (grade, section)
      )
    `;
    
    await connection.execute(createQuery);
    console.log('✅ student_assignment table created successfully!');
    
    // Show the table structure
    console.log('\n📊 Table Structure:');
    const [structure] = await connection.execute('DESCRIBE student_assignment');
    console.table(structure);
    
    // Insert some sample data to demonstrate
    console.log('\n📝 Inserting sample data...');
    const insertQuery = `
      INSERT INTO student_assignment (student_id, student_name, grade, section)
      SELECT s.id, CONCAT(s.first_name, ' ', s.last_name), g.grade, g.grade_part
      FROM students s
      CROSS JOIN grades g
      LIMIT 5
    `;
    
    try {
      const [result] = await connection.execute(insertQuery);
      console.log(`✅ Inserted ${result.affectedRows} sample records`);
      
      // Show the table data
      console.log('\n📋 Current Table Data:');
      const [rows] = await connection.execute(`
        SELECT 
          student_id AS 'Student ID',
          student_name AS 'Student Name', 
          grade AS 'Grade',
          section AS 'Section',
          assigned_at AS 'Assigned At',
          updated_at AS 'Updated At'
        FROM student_assignment
        ORDER BY grade, section, student_name
      `);
      console.table(rows);
      
    } catch (insertError) {
      console.log('ℹ️  No sample data inserted (students or grades tables may be empty)');
    }
    
  } catch (error) {
    console.error('❌ Error creating student_assignment table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createStudentAssignmentTable().catch(console.error);
