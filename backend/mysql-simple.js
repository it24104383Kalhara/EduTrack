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
  password: process.env.DB_PASSWORD || 'navodya@2004',
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
    const rooms = await query('SELECT * FROM rooms ORDER BY room_number');
    
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
      console.log('- GET /health');
      console.log('');
      console.log('✅ MySQL database connected with password: navodya@2004');
      console.log('📄 Database: edutrack_hostel');
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
