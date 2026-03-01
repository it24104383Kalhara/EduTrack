import express from 'express';
import cors from 'cors';

const app = express();
const port = 5000;

// In-memory storage (simulating localStorage)
let grades: any[] = [];
let students: any[] = [];

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'EduTrack Backend API',
        version: '1.0.0',
        status: 'Running'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Get all grades
app.get('/api/grades', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Grades retrieved successfully',
      data: grades,
      count: grades.length,
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  }
});

// Create new grade
app.post('/api/grades/create', (req, res) => {
  try {
    const { grade, grade_part } = req.body;
    
    // Check for duplicate
    const isDuplicate = grades.some((g: any) => 
      g.grade === grade && g.grade_part.toLowerCase() === grade_part.toLowerCase()
    );
    
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Grade already exists',
        error: `Grade ${grade} ${grade_part} is already registered`,
        timestamp: new Date().toISOString(),
        endpoint: '/create'
      });
    }
    
    const newGrade = {
      id: Date.now(),
      grade,
      grade_part,
      created_at: new Date().toISOString(),
      students: []
    };
    
    grades.push(newGrade);
    
    res.status(201).json({
      success: true,
      message: 'Grade created successfully!',
      data: newGrade,
      timestamp: new Date().toISOString(),
      endpoint: '/create'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/create'
    });
  }
});

// Assign student to grade
app.post('/api/grades/:gradeId/assign-student/:studentId', (req, res) => {
  try {
    const gradeIdParam = req.params.gradeId;
    const studentIdParam = req.params.studentId;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    const studentId = parseInt(Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam);
    
    const gradeIndex = grades.findIndex((g: any) => g.id === gradeId);
    if (gradeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}/assign-student/${studentId}`
      });
    }
    
    // Note: Students are stored in localStorage, so we don't validate student existence here
    // The frontend will handle student validation
    const grade = grades[gradeIndex];
    
    // Check if student is already assigned to this grade
    if (!grade.students) {
      grade.students = [];
    }
    
    const isStudentAssigned = grade.students.some((s: any) => s.id === studentId);
    
    if (isStudentAssigned) {
      // Remove student from grade
      grade.students = grade.students.filter((s: any) => s.id !== studentId);
      
      res.json({
        success: true,
        message: 'Student removed from grade successfully',
        data: {
          grade_id: gradeId,
          student_id: studentId,
          removed_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}/assign-student/${studentId}`
      });
    } else {
      // Assign student to grade
      let studentData = {
        id: studentId,
        assigned_at: new Date().toISOString()
      };
      
      // If student details are sent in request body, use them
      if (req.body && req.body.student) {
        studentData = {
          ...studentData,
          ...req.body.student
        };
      }
      
      grade.students.push(studentData);
      
      res.json({
        success: true,
        message: 'Student assigned to grade successfully',
        data: {
          grade_id: gradeId,
          student_id: studentId,
          assigned_at: new Date().toISOString(),
          student_details: req.body?.student || null
        },
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}/assign-student/${studentId}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update student assignment',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.gradeId}/assign-student/${req.params.studentId}`
    });
  }
});

// Delete grade
app.delete('/api/grades/:id', (req, res) => {
  try {
    const gradeIdParam = req.params.id;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    
    const gradeIndex = grades.findIndex((g: any) => g.id === gradeId);
    if (gradeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}`
      });
    }
    
    grades.splice(gradeIndex, 1);
    
    res.json({
      success: true,
      message: 'Grade deleted successfully',
      data: {
        grade_id: gradeId,
        deleted_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      endpoint: `/${gradeId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// Clear all grades
app.delete('/api/grades', (req, res) => {
  try {
    grades = [];
    
    res.json({
      success: true,
      message: 'All grades cleared successfully',
      data: {
        cleared_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear grades',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  }
});

// Get all students
app.get('/api/students', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Students retrieved successfully',
      data: students,
      count: students.length,
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API endpoints available at:`);
    console.log(`  - GET  /api/grades - Get all grades`);
    console.log(`  - POST /api/grades/create - Create new grade`);
    console.log(`  - POST /api/grades/:gradeId/assign-student/:studentId - Assign/remove student to grade`);
    console.log(`  - GET  /api/students - Get all students`);
});
