import { Router, Request, Response } from 'express';
import GradeModel from '../models/Grade';
import { validateGradeCreation } from '../middleware/validation';

// ============================================================================
// GRADE API ROUTES
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Complete CRUD operations for grade management
// ============================================================================

const router = Router();

// ============================================================================
// ENDPOINT: POST /api/grades/create
// PURPOSE: Create a new grade in the system
// ACCESS: Public (with validation middleware)
// ============================================================================
router.post('/create', validateGradeCreation, async (req: Request, res: Response) => {
  try {
    // Extract grade data from request body
    const { grade, grade_part } = req.body;
    
    // Check for duplicate grade
    const existingGrade = await GradeModel.findByGradeAndPart(grade, grade_part);
    if (existingGrade) {
      return res.status(409).json({
        success: false,
        message: 'Grade already exists',
        error: `Grade ${grade} Part ${grade_part} is already registered`,
        timestamp: new Date().toISOString(),
        endpoint: '/create'
      });
    }
    
    // Create new grade record in database
    const newGrade = await GradeModel.create({
      grade,
      grade_part
    });
    
    // Return success response with grade details
    res.status(201).json({
      success: true,
      message: 'Grade created successfully!',
      data: {
        id: newGrade.id,
        grade: newGrade.grade,
        grade_part: newGrade.grade_part,
        created_at: newGrade.created_at
      },
      timestamp: new Date().toISOString(),
      endpoint: '/create'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_CREATE_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to create grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/create'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/grades
// PURPOSE: Retrieve all grades from the database
// ACCESS: Public
// ============================================================================
router.get('/', async (req: Request, res: Response) => {
  try {
    // Fetch all grade records
    const grades = await GradeModel.findAll();
    
    // Return success response with grade data
    res.status(200).json({
      success: true,
      message: 'Grades retrieved successfully',
      data: grades,
      count: grades.length,
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_FETCH_ALL_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/grades/assignments
// PURPOSE: Get all student assignments with detailed information
// ============================================================================
router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const assignments = await GradeModel.getAllStudentAssignments();
    
    res.json({
      success: true,
      message: 'Student assignments retrieved successfully',
      data: assignments,
      count: assignments.length,
      timestamp: new Date().toISOString(),
      endpoint: '/assignments'
    });
    
  } catch (error) {
    console.error(' [GET_ASSIGNMENTS_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student assignments',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/assignments'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/grades/:id/assignments
// PURPOSE: Get student assignments for a specific grade
// ============================================================================
router.get('/:id/assignments', async (req: Request, res: Response) => {
  try {
    const gradeIdParam = req.params.id;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        timestamp: new Date().toISOString(),
        endpoint: `/${req.params.id}/assignments`
      });
    }
    
    const assignments = await GradeModel.getStudentAssignmentsByGrade(gradeId);
    
    res.json({
      success: true,
      message: `Student assignments for grade ${gradeId} retrieved successfully`,
      data: assignments,
      count: assignments.length,
      timestamp: new Date().toISOString(),
      endpoint: `/${gradeId}/assignments`
    });
    
  } catch (error) {
    console.error('🔴 [GET_ASSIGNMENTS_BY_GRADE_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student assignments for grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}/assignments`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/grades/:id
// PURPOSE: Retrieve a specific grade by ID
// ACCESS: Public
// ============================================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Extract and validate grade ID
    const idParam = req.params.id;
    const gradeId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    // Validate ID format
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID format',
        error: 'ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Fetch grade by ID
    const grade = await GradeModel.findById(gradeId);
    
    // Check if grade exists
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Return success response with grade data
    res.status(200).json({
      success: true,
      message: 'Grade retrieved successfully',
      data: grade,
      timestamp: new Date().toISOString(),
      endpoint: `/${idParam}`
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_FETCH_BY_ID_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// ============================================================================
// ENDPOINT: PUT /api/grades/:id
// PURPOSE: Update an existing grade's information
// ACCESS: Public (with validation middleware)
// ============================================================================
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // Extract and validate grade ID
    const idParam = req.params.id;
    const gradeId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    // Validate ID format
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID format',
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
    
    // Check if grade exists
    const existingGrade = await GradeModel.findById(gradeId);
    if (!existingGrade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade found with ID: ${gradeId}`,
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Check for duplicate grade if updating grade/part
    if (updateData.grade !== undefined || updateData.grade_part !== undefined) {
      const newGrade = updateData.grade !== undefined ? updateData.grade : existingGrade.grade;
      const newGradePart = updateData.grade_part !== undefined ? updateData.grade_part : existingGrade.grade_part;
      
      // Skip duplicate check if updating the same grade to the same values
      if (newGrade !== existingGrade.grade || newGradePart !== existingGrade.grade_part) {
        const duplicateGrade = await GradeModel.findByGradeAndPart(newGrade, newGradePart);
        if (duplicateGrade && duplicateGrade.id !== gradeId) {
          return res.status(409).json({
            success: false,
            message: 'Grade already exists',
            error: `Grade ${newGrade} Part ${newGradePart} is already registered`,
            timestamp: new Date().toISOString(),
            endpoint: `/${idParam}`
          });
        }
      }
    }

    // Update grade record
    const updatedGrade = await GradeModel.update(gradeId, updateData);
    
    // Return success response with updated data
    res.status(200).json({
      success: true,
      message: 'Grade updated successfully',
      data: updatedGrade,
      timestamp: new Date().toISOString(),
      endpoint: `/${idParam}`
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_UPDATE_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to update grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// ============================================================================
// ENDPOINT: DELETE /api/grades/clear
// PURPOSE: Remove all grades from the database (admin operation)
// ACCESS: Public (should be protected in production)
// ============================================================================
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    // Delete all grade records
    const deletedCount = await GradeModel.clearAll();
    
    // Return success response with deletion count
    res.status(200).json({
      success: true,
      message: 'All grades cleared successfully',
      data: {
        deleted_count: deletedCount,
        cleared_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      endpoint: '/clear'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_CLEAR_ALL_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to clear all grades',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/clear'
    });
  }
});

// ============================================================================
// ENDPOINT: DELETE /api/grades/:id
// PURPOSE: Remove a grade from the database
// ACCESS: Public
// ============================================================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Extract and validate grade ID
    const idParam = req.params.id;
    const gradeId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    // Validate ID format
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID format',
        error: 'ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Check if grade exists
    const existingGrade = await GradeModel.findById(gradeId);
    if (!existingGrade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }

    // Delete grade record
    const deleted = await GradeModel.delete(gradeId);
    
    // Check deletion result
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Grade deleted successfully',
        data: {
          deleted_grade_id: gradeId,
          deleted_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete grade',
        error: 'Database operation failed',
        timestamp: new Date().toISOString(),
        endpoint: `/${idParam}`
      });
    }
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_DELETE_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to delete grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// ============================================================================
// ENDPOINT: POST /api/grades/:gradeId/assign-student/:studentId
// PURPOSE: Assign a student to a specific grade
// ACCESS: Public
// ============================================================================
router.post('/:gradeId/assign-student/:studentId', async (req: Request, res: Response) => {
  try {
    // Extract and validate IDs
    const gradeIdParam = req.params.gradeId;
    const studentIdParam = req.params.studentId;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    const studentId = parseInt(Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam);
    
    // Validate ID formats
    if (isNaN(gradeId) || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'Both grade ID and student ID must be valid numbers',
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeIdParam}/assign-student/${studentIdParam}`
      });
    }

    // Check if student is already assigned to any grade
    const allGrades = await GradeModel.findAll();
    const existingAssignment = allGrades.find(grade => 
      grade.students?.some(student => student.id === studentId)
    );
    
    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: 'Student already assigned to another grade',
        error: `Student ${studentId} is already assigned to grade ${existingAssignment.grade}-${existingAssignment.grade_part}. A student can only be assigned to one grade at a time.`,
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeIdParam}/assign-student/${studentIdParam}`
      });
    }

    // Assign student to grade
    const assignment = await GradeModel.assignStudent(gradeId, studentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment failed',
        error: 'Grade or student not found, or student already assigned to this grade',
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeIdParam}/assign-student/${studentIdParam}`
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Student assigned to grade successfully',
      data: {
        grade_id: gradeId,
        student_id: studentId,
        assigned_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      endpoint: `/${gradeIdParam}/assign-student/${studentIdParam}`
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_ASSIGN_STUDENT_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to assign student to grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.gradeId}/assign-student/${req.params.studentId}`
    });
  }
});

// ============================================================================
// ENDPOINT: DELETE /api/grades/:gradeId/remove-student/:studentId
// PURPOSE: Remove a student from a specific grade
// ACCESS: Public
// ============================================================================
router.delete('/:gradeId/remove-student/:studentId', async (req: Request, res: Response) => {
  try {
    // Extract and validate IDs
    const gradeIdParam = req.params.gradeId;
    const studentIdParam = req.params.studentId;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    const studentId = parseInt(Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam);
    
    // Validate ID formats
    if (isNaN(gradeId) || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'Both grade ID and student ID must be valid numbers',
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeIdParam}/remove-student/${studentIdParam}`
      });
    }

    // Remove student from grade
    const removal = await GradeModel.removeStudent(gradeId, studentId);
    
    if (!removal) {
      return res.status(404).json({
        success: false,
        message: 'Removal failed',
        error: 'Grade or student not found, or student not assigned to this grade',
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeIdParam}/remove-student/${studentIdParam}`
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Student removed from grade successfully',
      data: {
        grade_id: gradeId,
        student_id: studentId,
        removed_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      endpoint: `/${gradeIdParam}/remove-student/${studentIdParam}`
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('🔴 [GRADE_REMOVE_STUDENT_ERROR]:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to remove student from grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.gradeId}/remove-student/${req.params.studentId}`
    });
  }
});

// ============================================================================
// EXPORT GRADE ROUTER
// ============================================================================
// Usage: app.use('/api/grades', gradeRoutes);
// ============================================================================
export default router;
