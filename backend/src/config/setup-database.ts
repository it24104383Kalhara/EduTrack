import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const setupDatabase = async () => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'edutrack'}\``);
    await connection.execute(`USE \`${process.env.DB_NAME || 'edutrack'}\``);
    
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
    
    // Create grades table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade INT NOT NULL,
        grade_part VARCHAR(30) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_grade (grade, grade_part)
      )
    `);
    
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
    
    // Create marks table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id VARCHAR(50) NOT NULL,
        grade_id INT NOT NULL,
        term VARCHAR(50) NOT NULL,
        exam_type ENUM('first', 'second', 'third') NOT NULL,
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
    
    // Create email_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mark_id INT NOT NULL,
        student_id INT NOT NULL,
        parent_email VARCHAR(255) NOT NULL,
        email_type ENUM('low_mark_alert') NOT NULL DEFAULT 'low_mark_alert',
        status ENUM('sent', 'failed') NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mark_id) REFERENCES marks(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_email_log (mark_id, email_type),
        INDEX idx_mark_id (mark_id),
        INDEX idx_student_id (student_id),
        INDEX idx_status (status),
        INDEX idx_email_type (email_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Create student_assignment table (junction table)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_assignment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade_id INT NOT NULL,
        student_id INT NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        grade INT NOT NULL,
        section VARCHAR(50) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (grade_id, student_id)
      )
    `);
    
    console.log('Database setup completed successfully!');
    console.log('Tables created: students, grades, subjects, marks, email_logs, student_assignment');
    
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}
