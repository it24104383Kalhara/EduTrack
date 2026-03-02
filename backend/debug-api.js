const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// Database config
const config = {
  host: 'localhost',
  user: 'root',
  password: 'ishani',
  database: 'edutrack'
};

// Test the exact API logic
async function testSubjectCreation() {
  try {
    console.log('🔍 Testing subject creation logic...');
    
    // Simulate the exact data being sent from frontend
    const subjectData = {
      name: 'Test Subject',
      code: 'TST001',
      grades: ['6', '7'],
      stream: undefined,
      type: '6-11'
    };
    
    console.log('📤 Subject data:', subjectData);
    
    // Test validation (from routes/subjects.ts)
    const { name, code, grades, stream, type } = subjectData;
    
    if (!name || !code || !grades || !type) {
      console.log('❌ Validation failed: Missing required fields');
      return;
    }
    
    if (type !== '6-11' && type !== '12-13') {
      console.log('❌ Validation failed: Invalid type');
      return;
    }
    
    if (!Array.isArray(grades) || grades.length === 0) {
      console.log('❌ Validation failed: Invalid grades');
      return;
    }
    
    console.log('✅ Validation passed');
    
    // Test database connection
    const conn = await mysql.createConnection(config);
    console.log('✅ Database connected');
    
    // Test duplicate check
    const [existingCode] = await conn.query('SELECT * FROM subjects WHERE code = ?', [code]);
    if (existingCode.length > 0) {
      console.log('❌ Duplicate code found');
      return;
    }
    console.log('✅ No duplicate code');
    
    // Test duplicate subject check
    for (const grade of grades) {
      const [existing] = await conn.query(
        'SELECT * FROM subjects WHERE LOWER(name) = LOWER(?) AND JSON_CONTAINS(grades, ?) AND stream IS NULL',
        [name, JSON.stringify([grade])]
      );
      if (existing.length > 0) {
        console.log(`❌ Duplicate subject found in grade ${grade}`);
        return;
      }
    }
    console.log('✅ No duplicate subjects');
    
    // Test the actual insert
    const id = `SUBJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [result] = await conn.query(
      'INSERT INTO subjects (id, name, code, grades, stream, type) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        name.trim(),
        code.trim(),
        JSON.stringify(grades),
        stream ? JSON.stringify(Array.isArray(stream) ? stream : [stream]) : null,
        type
      ]
    );
    
    console.log('✅ Insert successful:', result);
    
    // Verify the insert
    const [newSubject] = await conn.query('SELECT * FROM subjects WHERE id = ?', [id]);
    console.log('📋 New subject:', newSubject[0]);
    
    await conn.end();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('❌ Full error:', error);
  }
}

testSubjectCreation();
