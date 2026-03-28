const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ishani',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const setupDatabase = async () => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'edutrack'}\``);
    await connection.query(`USE \`${process.env.DB_NAME || 'edutrack'}\``);
    
    console.log('🔧 Setting up database tables...');
    
    // Create students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender ENUM('male', 'female', 'other') NOT NULL,
        religion VARCHAR(50) NOT NULL,
        ethnicity VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        nationality VARCHAR(50) NOT NULL,
        parent_type ENUM('father', 'mother', 'guardian') NOT NULL,
        parent_name VARCHAR(100) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        parent_address TEXT NOT NULL,
        parent_gender ENUM('male', 'female', 'other') NOT NULL,
        parent_email VARCHAR(100),
        parent_religion VARCHAR(50) NOT NULL,
        parent_ethnicity VARCHAR(50) NOT NULL,
        parent_nationality VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table created');
    
    // Create grades table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade INT NOT NULL,
        grade_part VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_grade (grade, grade_part)
      )
    `);
    console.log('✅ Grades table created');
    
    // Create subjects table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        grades JSON NOT NULL,
        stream JSON,
        type ENUM('6-11', '12-13') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_code (code),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Subjects table created');
    
    // Create student_assignments table (junction table)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade_id INT NOT NULL,
        student_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (grade_id, student_id)
      )
    `);
    console.log('✅ Student assignments table created');
    
    // Create marks table
    await connection.execute(`
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
        grade_obtained ENUM('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F') GENERATED ALWAYS AS (
          CASE 
            WHEN (marks_obtained / max_marks * 100) >= 90 THEN 'A+'
            WHEN (marks_obtained / max_marks * 100) >= 85 THEN 'A'
            WHEN (marks_obtained / max_marks * 100) >= 75 THEN 'B+'
            WHEN (marks_obtained / max_marks * 100) >= 65 THEN 'B'
            WHEN (marks_obtained / max_marks * 100) >= 55 THEN 'C+'
            WHEN (marks_obtained / max_marks * 100) >= 45 THEN 'C'
            WHEN (marks_obtained / max_marks * 100) >= 35 THEN 'D'
            ELSE 'F'
          END
        ) STORED,
        remarks TEXT,
        exam_date DATE NOT NULL,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        UNIQUE KEY unique_mark (student_id, subject_id, grade_id, term, exam_type),
        INDEX idx_student_id (student_id),
        INDEX idx_subject_id (subject_id),
        INDEX idx_grade_id (grade_id),
        INDEX idx_term (term),
        INDEX idx_exam_date (exam_date),
        INDEX idx_percentage (percentage),
        INDEX idx_grade_obtained (grade_obtained)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Marks table created');
    
    // Create attendance table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        grade_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
        remarks TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        UNIQUE KEY unique_attendance (student_id, date),
        INDEX idx_student_id (student_id),
        INDEX idx_grade_id (grade_id),
        INDEX idx_date (date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Attendance table created');
    
    console.log('✅ Database setup completed successfully!');
    console.log('Tables created: students, grades, subjects, student_assignments, marks, attendance');
    console.log('📝 No sample data inserted - starting with clean database');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
