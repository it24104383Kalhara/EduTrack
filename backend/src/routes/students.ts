import { Router, Request, Response } from 'express';
import { StudentModel } from '../models/Student';
import { validateStudentRegistration } from '../middleware/validation';

const router = Router();

// Register a new student
router.post('/register', validateStudentRegistration, async (req: Request, res: Response) => {
  try {
    const studentData = req.body;
    
    // Create the student in the database
    const newStudent = await StudentModel.create(studentData);
    
    res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
      data: {
        id: newStudent.id,
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        parent_name: newStudent.parent_name,
        created_at: newStudent.created_at
      }
    });
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register student',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all students
router.get('/', async (req: Request, res: Response) => {
  try {
    const students = await StudentModel.findAll();
    
    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get student by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const studentId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    const student = await StudentModel.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update student
router.put('/:id', validateStudentRegistration, async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const studentId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    // Check if student exists
    const existingStudent = await StudentModel.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const updatedStudent = await StudentModel.update(studentId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete student
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const studentId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    // Check if student exists
    const existingStudent = await StudentModel.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const deleted = await StudentModel.delete(studentId);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete student'
      });
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
