import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const initDatabase = async () => {
  try {
    const dbPath = path.join(__dirname, '../../data/edutrack.db');
    
    // Create data directory if it doesn't exist
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('Connected to SQLite database');

    // Create tables
    await createTables();
    await seedData();

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

async function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Create rooms table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create students table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_number TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      address TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      parent_email TEXT,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_room INTEGER,
      FOREIGN KEY (assigned_room) REFERENCES rooms(id)
    )
  `);

  // Create payments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      due_date DATE NOT NULL,
      payment_date DATE,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_type TEXT NOT NULL,
      email_sent BOOLEAN DEFAULT FALSE,
      warning_sent BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  // Create email_logs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      parent_email TEXT NOT NULL,
      email_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);
}

async function seedData() {
  if (!db) throw new Error('Database not initialized');

  // Check if rooms already exist
  const roomCount = await db.get('SELECT COUNT(*) as count FROM rooms');
  
  if (roomCount.count === 0) {
    // Create 25 rooms
    for (let i = 1; i <= 25; i++) {
      await db.run(
        'INSERT INTO rooms (room_number, capacity) VALUES (?, ?)',
        [`H${i.toString().padStart(3, '0')}`, 5]
      );
    }
    console.log('Created 25 hostel rooms');
  }

  // Create sample students if none exist
  const studentCount = await db.get('SELECT COUNT(*) as count FROM students');
  
  if (studentCount.count === 0) {
    const sampleStudents = [
      {
        registration_number: 'REG2024001',
        student_name: 'John Smith',
        grade: 'Grade 10',
        address: '123 Main St, City',
        parent_name: 'Robert Smith',
        parent_phone: '+1234567890',
        parent_email: 'robert.smith@email.com',
        assigned_room: 1
      },
      {
        registration_number: 'REG2024002',
        student_name: 'Emily Johnson',
        grade: 'Grade 11',
        address: '456 Oak Ave, City',
        parent_name: 'Mary Johnson',
        parent_phone: '+1234567891',
        parent_email: 'mary.johnson@email.com',
        assigned_room: 1
      },
      {
        registration_number: 'REG2024003',
        student_name: 'Michael Brown',
        grade: 'Grade 9',
        address: '789 Pine Rd, City',
        parent_name: 'James Brown',
        parent_phone: '+1234567892',
        parent_email: 'james.brown@email.com',
        assigned_room: 2
      }
    ];

    for (const student of sampleStudents) {
      await db.run(`
        INSERT INTO students (registration_number, student_name, grade, address, parent_name, parent_phone, parent_email, assigned_room)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        student.registration_number,
        student.student_name,
        student.grade,
        student.address,
        student.parent_name,
        student.parent_phone,
        student.parent_email,
        student.assigned_room
      ]);
    }

    // Create sample payments
    const paymentTypes = [
      { type: 'hostel_fee', amount: 2000 },
      { type: 'tuition_fee', amount: 5000 },
      { type: 'mess_fee', amount: 1500 },
      { type: 'library_fee', amount: 500 }
    ];

    for (let studentId = 1; studentId <= 3; studentId++) {
      for (const paymentType of paymentTypes) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1, 31);
        
        await db.run(`
          INSERT INTO payments (student_id, amount, due_date, status, payment_type)
          VALUES (?, ?, ?, ?, ?)
        `, [
          studentId,
          paymentType.amount,
          dueDate.toISOString().split('T')[0],
          studentId === 1 ? 'paid' : 'pending',
          paymentType.type
        ]);
      }
    }

    console.log('Created sample students and payments');
  }
}

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};
