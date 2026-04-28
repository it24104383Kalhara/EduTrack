import { Router, Response } from 'express';
import { StudentModel } from '../models/Student';
import { validateStudentRegistration } from '../middleware/validation';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';

// ============================================================================
// STUDENT API ROUTES
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Complete CRUD operations for student management
// ============================================================================

const router = Router();

// ============================================================================
// ENDPOINT: POST /api/students/register
// PURPOSE: Register a new student in the system
// ACCESS: Public (with validation middleware)
// ============================================================================
router.post('/register', validateStudentRegistration, async (req: AuthRequest, res: Response) => {
  try {
    // Extract student data from request body
    const studentData = req.body;
    
    // Create new student record in database
    const newStudent = await StudentModel.create(studentData);
    
    // Return success response with student details
    res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
      data: {
        id: newStudent.id,
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        parent_name: newStudent.parent_name,
        created_at: newStudent.created_at
      },
      timestamp: new Date().toISOString(),
      endpoint: '/register'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [STUDENT_REGISTER_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to register student',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/register'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/students
// PURPOSE: Retrieve students from the database
// ACCESS: Protected (filtered by role)
// ============================================================================
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let students;
    if (userRole === 'admin') {
      // Admins see all students
      students = await StudentModel.findAll();
    } else if (userRole === 'teacher') {
      // Teachers only see students assigned to their class
      const [rows] = await pool.query(`
        SELECT s.* 
        FROM students s
        INNER JOIN student_assignment sa ON s.id = sa.student_id
        INNER JOIN grades g ON sa.grade_id = g.id
        WHERE g.teacher_id = ?
        ORDER BY s.first_name, s.last_name
      `, [userId]);
      students = rows as any[];
    } else {
      students = [];
    }
    
    // Return success response with student data
    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: students,
      count: students.length,
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [STUDENT_FETCH_ALL_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/students/:id
// PURPOSE: Retrieve a specific student by ID
// ACCESS: Public
// ============================================================================
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Extract and validate student ID
    const idParam = req.params.id;
    const studentId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    // Validate ID format
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
        error: 'ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Fetch student by ID
    const student = await StudentModel.findById(studentId);
    
    // Check if student exists
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        error: `No student with ID ${studentId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Return success response with student data
    res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: student,
      timestamp: new Date().toISOString(),
      endpoint: `/${idParam}`
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [STUDENT_FETCH_BY_ID_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// ============================================================================
// ENDPOINT: PUT /api/students/:id
// PURPOSE: Update an existing student's information
// ACCESS: Public (with validation middleware)
// ============================================================================
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Extract and validate student ID
    const idParam = req.params.id;
    const studentId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    // Validate ID format
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
        error: 'ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }
    
    // Basic validation for update data
    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided',
        error: 'At least one field must be provided for update',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }
    
    // Check if student exists
    const existingStudent = await StudentModel.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        error: `No student found with ID: ${studentId}`,
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Update student record
    const updatedStudent = await StudentModel.update(studentId, updateData);
    
    // Return success response with updated data
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
      timestamp: new Date().toISOString(),
      endpoint: `/${idParam}`
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [STUDENT_UPDATE_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// ============================================================================
// ENDPOINT: DELETE /api/students/:id
// PURPOSE: Remove a student from the database
// ACCESS: Public
// ============================================================================
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Extract and validate student ID
    const idParam = req.params.id;
    const studentId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    // Validate ID format
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
        error: 'ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Check if student exists
    const existingStudent = await StudentModel.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        error: `No student with ID ${studentId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Delete student record
    const deleted = await StudentModel.delete(studentId);
    
    // Check deletion result
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
        data: {
          deleted_student_id: studentId,
          deleted_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete student',
        error: 'Database operation failed',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [STUDENT_DELETE_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// ============================================================================
// EXPORT STUDENT ROUTER
// ============================================================================
// Usage: app.use('/api/students', studentRoutes);
// ============================================================================
export default router;
