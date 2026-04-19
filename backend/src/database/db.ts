import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack_hostel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

export const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS edutrack_hostel');
    await connection.query('USE edutrack_hostel');
    
    // Create rooms table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_number VARCHAR(10) UNIQUE NOT NULL,
        capacity INT NOT NULL DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create students table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_number VARCHAR(20) UNIQUE NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        grade VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        parent_name VARCHAR(100) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        parent_email VARCHAR(100),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_room INT,
        FOREIGN KEY (assigned_room) REFERENCES rooms(id)
      )
    `);
    
    // Create payments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        due_date DATE NOT NULL,
        payment_date DATE,
        status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
        payment_type ENUM('hostel_fee', 'tuition_fee', 'mess_fee', 'library_fee') NOT NULL,
        email_sent BOOLEAN DEFAULT FALSE,
        warning_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);
    
    // Create email_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        parent_email VARCHAR(100) NOT NULL,
        email_type ENUM('reminder', 'warning', 'confirmation') NOT NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);
    
    // Initialize 25 rooms if they don't exist
    const [existingRooms] = await connection.query('SELECT COUNT(*) as count FROM rooms');
    const roomCount = (existingRooms as any)[0].count;
    
    if (roomCount === 0) {
      for (let i = 1; i <= 25; i++) {
        await connection.query(
          'INSERT INTO rooms (room_number, capacity) VALUES (?, ?)',
          [`H${i.toString().padStart(3, '0')}`, 5]
        );
      }
      console.log('Initialized 25 hostel rooms');
    }
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};
