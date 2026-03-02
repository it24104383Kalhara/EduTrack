const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Import the SubjectModel (simulating the actual route)
const mysql = require('mysql2/promise');
const config = {
  host: 'localhost',
  user: 'root',
  password: 'ishani',
  database: 'edutrack'
};

// Simulate the exact POST /api/subjects route
app.post('/test-subjects', async (req, res) => {
  try {
    console.log('🔍 Received request body:', req.body);
    
    const { name, code, grades, stream, type } = req.body;
    
    // Validation (exact same as in routes/subjects.ts)
    if (!name || !code || !grades || !type) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, code, grades, type'
      });
    }
    
    if (type !== '6-11' && type !== '12-13') {
      console.log('❌ Validation failed: Invalid type');
      return res.status(400).json({
        success: false,
        message: 'Invalid subject type. Must be "6-11" or "12-13"'
      });
    }
    
    if (!Array.isArray(grades) || grades.length === 0) {
      console.log('❌ Validation failed: Invalid grades');
      return res.status(400).json({
        success: false,
        message: 'Grades must be a non-empty array'
      });
    }
    
    console.log('✅ Validation passed');
    
    // Database operations
    const conn = await mysql.createConnection(config);
    
    // Check for duplicate subject code
    const [existingCode] = await conn.query('SELECT * FROM subjects WHERE code = ?', [code]);
    if (existingCode.length > 0) {
      console.log('❌ Duplicate code found');
      await conn.end();
      return res.status(400).json({
        success: false,
        message: `Subject code "${code}" already exists`
      });
    }
    
    console.log('✅ No duplicate code');
    
    // Check for duplicate subjects in selected grades
    for (const grade of grades) {
      const [existing] = await conn.query(
        'SELECT * FROM subjects WHERE LOWER(name) = LOWER(?) AND JSON_CONTAINS(grades, ?) AND stream IS NULL',
        [name, JSON.stringify([grade])]
      );
      if (existing.length > 0) {
        console.log(`❌ Duplicate subject found in grade ${grade}`);
        await conn.end();
        return res.status(400).json({
          success: false,
          message: `Subject "${name}" is already added to Grade ${grade}`
        });
      }
    }
    
    console.log('✅ No duplicate subjects');
    
    // Create subject
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
    
    const newSubject = {
      id,
      name: name.trim(),
      code: code.trim(),
      grades: JSON.stringify(grades),
      stream,
      type,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await conn.end();
    
    res.status(201).json({
      success: true,
      data: newSubject,
      message: 'Subject created successfully'
    });
    
  } catch (error) {
    console.error('🔴 Error creating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subject',
      error: error.message
    });
  }
});

// Test the endpoint
const testEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:3001/test-subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'API Test Subject',
        code: 'API001',
        grades: ['6', '7'],
        stream: undefined,
        type: '6-11'
      })
    });
    
    const result = await response.json();
    console.log('📤 API Response:', result);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
};

// Start test server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  
  // Run the test after server starts
  setTimeout(testEndpoint, 1000);
});
