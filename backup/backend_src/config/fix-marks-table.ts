import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const fixMarksTable = async () => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Drop the existing marks table
    await connection.execute('DROP TABLE IF EXISTS marks');
    console.log('✅ Dropped existing marks table');
    
    // Recreate marks table with correct schema
    await connection.execute(`
      CREATE TABLE marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id VARCHAR(50) NOT NULL,
        marks DECIMAL(5,2) NOT NULL,
        max_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
        exam_type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        INDEX idx_student_subject (student_id, subject_id),
        INDEX idx_exam_date (exam_type, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Recreated marks table with correct schema');
    
  } catch (error) {
    console.error('❌ Error fixing marks table:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

// Run fix if this file is executed directly
if (require.main === module) {
  fixMarksTable()
    .then(() => {
      console.log('Marks table fixed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}
