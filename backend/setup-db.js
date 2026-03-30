const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  try {
    console.log('🔄 Setting up database...');
    
    // Create connection without database specified
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS edutrack');
    await connection.query('USE edutrack');

    console.log('✅ Database connected');

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher') NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        gender ENUM('male', 'female'),
        grade VARCHAR(50),
        phone_number VARCHAR(20),
        birthday DATE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create teachers table
    const createTeachersTable = `
      CREATE TABLE IF NOT EXISTS teachers (
        user_id INT PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        gender ENUM('male', 'female'),
        grade VARCHAR(50),
        phone_number VARCHAR(20),
        birthday DATE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('🔄 Creating users table...');
    await connection.execute(createUsersTable);
    console.log('✅ Users table created');

    console.log('🔄 Creating teachers table...');
    await connection.execute(createTeachersTable);
    console.log('✅ Teachers table created');

    // Check if tables exist and show their structure
    const [tables] = await connection.execute('SHOW TABLES LIKE "users"');
    const [teachersTables] = await connection.execute('SHOW TABLES LIKE "teachers"');
    
    console.log('📊 Database tables status:');
    console.log('Users table exists:', tables.length > 0 ? '✅' : '❌');
    console.log('Teachers table exists:', teachersTables.length > 0 ? '✅' : '❌');

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
