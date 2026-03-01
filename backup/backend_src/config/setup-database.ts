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
        grade_part VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_grade (grade, grade_part)
      )
    `);
    
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
    
    console.log('Database setup completed successfully!');
    console.log('Tables created: students, grades, student_assignments');
    
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
