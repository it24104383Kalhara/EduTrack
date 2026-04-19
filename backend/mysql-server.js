const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack_hostel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database helper functions
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    console.log(`📊 Connected to database: ${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    // Check if database exists
    await query('CREATE DATABASE IF NOT EXISTS edutrack_hostel');
    await query('USE edutrack_hostel');
    
    // Create tables if they don't exist
    await createTables();
    
    // Insert sample data if tables are empty
    await insertSampleData();
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Rooms table
    `CREATE TABLE IF NOT EXISTS rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_number VARCHAR(20) NOT NULL UNIQUE,
      capacity INT NOT NULL DEFAULT 5,
      current_occupancy INT NOT NULL DEFAULT 0,
      floor_number VARCHAR(10),
      room_type ENUM('single', 'double', 'dormitory') DEFAULT 'dormitory',
      status ENUM('available', 'maintenance', 'full') DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    // Students table
    `CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      registration_number VARCHAR(50) NOT NULL UNIQUE,
      student_name VARCHAR(100) NOT NULL,
      grade VARCHAR(20) NOT NULL,
      parent_email VARCHAR(100),
      parent_phone VARCHAR(20),
      assigned_room INT NULL,
      room_number VARCHAR(20) NULL,
      admission_date DATE,
      status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_room) REFERENCES rooms(id) ON DELETE SET NULL
    )`,
    
    // Payments table
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_type ENUM('hostel_fee', 'tuition_fee', 'mess_fee', 'library_fee', 'other') NOT NULL,
      status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
      payment_date DATE NULL,
      due_date DATE NOT NULL,
      payment_method VARCHAR(50),
      transaction_id VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,
    
    // Email logs table
    `CREATE TABLE IF NOT EXISTS email_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NULL,
      parent_email VARCHAR(100) NOT NULL,
      email_type ENUM('payment_reminder', 'payment_warning', 'payment_confirmation', 'other') NOT NULL,
      subject VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
      sent_at TIMESTAMP NULL,
      error_message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
    )`
  ];

  for (const table of tables) {
    await query(table);
  }
}

async function insertSampleData() {
  // Check if rooms table is empty
  const roomCount = await query('SELECT COUNT(*) as count FROM rooms');
  
  if (roomCount[0].count === 0) {
    // Insert sample rooms
    await query(`
      INSERT INTO rooms (room_number, capacity, current_occupancy, floor_number, room_type, status) VALUES
      ('H001', 5, 2, '1', 'dormitory', 'available'),
      ('H002', 5, 0, '1', 'dormitory', 'available'),
      ('H003', 5, 3, '2', 'dormitory', 'available'),
      ('H004', 5, 1, '2', 'dormitory', 'available'),
      ('H005', 5, 0, '3', 'dormitory', 'available')
    `);

    // Insert sample students
    await query(`
      INSERT INTO students (registration_number, student_name, grade, parent_email, parent_phone, assigned_room, room_number, admission_date, status) VALUES
      ('REG2024001', 'John Smith', 'Grade 10', 'robert.smith@email.com', '+1234567890', 1, 'H001', '2024-01-15', 'active'),
      ('REG2024002', 'Emily Johnson', 'Grade 11', 'mary.johnson@email.com', '+1234567891', 1, 'H001', '2024-01-16', 'active'),
      ('REG2024003', 'Michael Brown', 'Grade 9', 'james.brown@email.com', '+1234567892', 3, 'H003', '2024-01-17', 'active'),
      ('REG2024004', 'Sarah Davis', 'Grade 12', 'sarah.parent@email.com', '+1234567893', 4, 'H004', '2024-01-18', 'active'),
      ('REG2024005', 'David Wilson', 'Grade 8', 'david.parent@email.com', '+1234567894', NULL, NULL, '2024-01-19', 'active')
    `);

    // Insert sample payments
    await query(`
      INSERT INTO payments (student_id, amount, payment_type, status, payment_date, due_date, payment_method, transaction_id, description) VALUES
      (1, 2000.00, 'hostel_fee', 'paid', '2024-01-20', '2024-01-15', 'bank_transfer', 'TXN001', 'January hostel fee'),
      (2, 2000.00, 'hostel_fee', 'pending', NULL, '2024-01-15', NULL, NULL, 'January hostel fee'),
      (3, 5000.00, 'tuition_fee', 'pending', NULL, '2024-01-20', NULL, NULL, 'Q1 tuition fee'),
      (4, 1500.00, 'mess_fee', 'pending', NULL, '2024-01-25', NULL, NULL, 'January mess fee'),
      (5, 500.00, 'library_fee', 'pending', NULL, '2024-01-30', NULL, NULL, 'Annual library fee')
    `);

    console.log('✅ Sample data inserted successfully');
  }
}

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MySQL API is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await query(`
      SELECT r.*, 
             (SELECT COUNT(*) FROM students s WHERE s.assigned_room = r.id AND s.status = 'active') as assigned_count
      FROM rooms r 
      ORDER BY r.room_number
    `);
    
    res.json({
      success: true,
      data: rooms,
      message: 'Rooms retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rooms',
      error: error.message
    });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await query(`
      SELECT s.*, r.room_number as assigned_room_number
      FROM students s
      LEFT JOIN rooms r ON s.assigned_room = r.id
      WHERE s.status = 'active'
      ORDER BY s.student_name
    `);
    
    res.json({
      success: true,
      data: students,
      message: 'Students retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
      error: error.message
    });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await query(`
      SELECT p.*, s.student_name, s.registration_number, s.parent_email
      FROM payments p
      JOIN students s ON p.student_id = s.id
      ORDER BY p.due_date DESC
    `);
    
    res.json({
      success: true,
      data: payments,
      message: 'Payments retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
});

app.get('/api/payments/pending', async (req, res) => {
  try {
    const payments = await query(`
      SELECT p.*, s.student_name, s.registration_number, s.parent_email
      FROM payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.status = 'pending'
      ORDER BY p.due_date ASC
    `);
    
    res.json({
      success: true,
      data: payments,
      message: 'Pending payments retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending payments',
      error: error.message
    });
  }
});

app.get('/api/payments/overdue', async (req, res) => {
  try {
    const payments = await query(`
      SELECT p.*, s.student_name, s.registration_number, s.parent_email
      FROM payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.status = 'pending' AND p.due_date < CURDATE()
      ORDER BY p.due_date ASC
    `);
    
    res.json({
      success: true,
      data: payments,
      message: 'Overdue payments retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue payments',
      error: error.message
    });
  }
});

app.get('/api/payments/due-in-week', async (req, res) => {
  try {
    const payments = await query(`
      SELECT p.*, s.student_name, s.registration_number, s.parent_email
      FROM payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.status = 'pending' AND DATEDIFF(p.due_date, CURDATE()) <= 7
      ORDER BY p.due_date ASC
    `);
    
    res.json({
      success: true,
      data: payments,
      message: 'Payments due in week retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments due in week',
      error: error.message
    });
  }
});

// Dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM rooms WHERE current_occupancy > 0) as occupied_rooms,
        (SELECT COUNT(*) FROM students WHERE status = 'active') as total_students,
        (SELECT COUNT(*) FROM students WHERE status = 'active' AND assigned_room IS NOT NULL) as students_in_hostel,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending' AND due_date < CURDATE()) as overdue_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') as total_collected,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending' AND DATEDIFF(due_date, CURDATE()) <= 7) as due_this_week
    `);
    
    res.json({
      success: true,
      data: stats[0],
      message: 'Dashboard statistics retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'EduTrack MySQL Backend',
    database: 'MySQL'
  });
});

app.get('/', (req, res) => {
  res.send('EduTrack Hostel Management MySQL Backend is running!');
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Initialize database
    await initializeDatabase();

    // Start server
    app.listen(port, () => {
      console.log(`🚀 EduTrack MySQL Backend is running on port ${port}`);
      console.log('📊 Available endpoints:');
      console.log('- GET /api/test');
      console.log('- GET /api/rooms');
      console.log('- GET /api/students');
      console.log('- GET /api/payments');
      console.log('- GET /api/payments/pending');
      console.log('- GET /api/payments/overdue');
      console.log('- GET /api/payments/due-in-week');
      console.log('- GET /api/dashboard/stats');
      console.log('- GET /health');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

startServer();
