import { Router, Request, Response } from 'express';

const router = Router();

// Get all grades
router.get('/', (req: Request, res: Response) => {
  try {
    const grades = JSON.parse(localStorage.getItem('grades') || '[]');
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
router.post('/create', (req: Request, res: Response) => {
  try {
    const { grade, grade_part } = req.body;
    const grades = JSON.parse(localStorage.getItem('grades') || '[]');
    
    // Check for duplicate
    const isDuplicate = grades.some((g: any) => 
      g.grade === grade && g.grade_part.toLowerCase() === grade_part.toLowerCase()
    );
    
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Grade already exists',
        error: `Grade ${grade} Part ${grade_part} is already registered`,
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
    localStorage.setItem('grades', JSON.stringify(grades));
    
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

// Update grade
router.put('/:id', (req: Request, res: Response) => {
  try {
    const gradeIdParam = req.params.id;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    
    const { grade, grade_part } = req.body;
    
    const grades = JSON.parse(localStorage.getItem('grades') || '[]');
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
    
    // Check for duplicate (excluding current grade)
    const isDuplicate = grades.some((g: any) => 
      g.id !== gradeId && g.grade === grade && g.grade_part.toLowerCase() === grade_part.toLowerCase()
    );
    
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Grade already exists',
        error: `Grade ${grade} Part ${grade_part} is already registered`,
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}`
      });
    }
    
    // Update grade
    grades[gradeIndex].grade = grade;
    grades[gradeIndex].grade_part = grade_part;
    
    localStorage.setItem('grades', JSON.stringify(grades));
    
    res.json({
      success: true,
      message: 'Grade updated successfully!',
      data: grades[gradeIndex],
      timestamp: new Date().toISOString(),
      endpoint: `/${gradeId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.id}`
    });
  }
});

// Assign student to grade
router.post('/:gradeId/assign-student/:studentId', (req: Request, res: Response) => {
  try {
    const gradeIdParam = req.params.gradeId;
    const studentIdParam = req.params.studentId;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    const studentId = parseInt(Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam);
    
    const grades = JSON.parse(localStorage.getItem('grades') || '[]');
    
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
    
    // Get student data from request body (sent by frontend)
    const student = req.body.student;
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student data not provided',
        error: 'Student data is required in request body',
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}/assign-student/${studentId}`
      });
    }
    
    // Check if student is already assigned to ANY grade
    for (const grade of grades) {
      if (grade.students && grade.students.some((s: any) => s.id === studentId)) {
        return res.status(409).json({
          success: false,
          message: 'Student already assigned to another grade',
          error: `Student ${studentId} is already assigned to grade ${grade.grade}-${grade.grade_part}. A student can only be assigned to one grade at a time.`,
          timestamp: new Date().toISOString(),
          endpoint: `/${gradeId}/assign-student/${studentId}`
        });
      }
    }
    
    if (!grades[gradeIndex].students) {
      grades[gradeIndex].students = [];
    }
    
    grades[gradeIndex].students.push(student);
    localStorage.setItem('grades', JSON.stringify(grades));
    
    res.json({
      success: true,
      message: 'Student assigned to grade successfully',
      data: {
        grade_id: gradeId,
        student_id: studentId,
        assigned_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      endpoint: `/${gradeId}/assign-student/${studentId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign student to grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.gradeId}/assign-student/${req.params.studentId}`
    });
  }
});

// Remove student from grade
router.delete('/:gradeId/remove-student/:studentId', (req: Request, res: Response) => {
  try {
    const gradeIdParam = req.params.gradeId;
    const studentIdParam = req.params.studentId;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    const studentId = parseInt(Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam);
    
    const grades = JSON.parse(localStorage.getItem('grades') || '[]');
    
    const gradeIndex = grades.findIndex((g: any) => g.id === gradeId);
    if (gradeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}/remove-student/${studentId}`
      });
    }
    
    if (!grades[gradeIndex].students || grades[gradeIndex].students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students assigned to this grade',
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}/remove-student/${studentId}`
      });
    }
    
    const studentIndex = grades[gradeIndex].students.findIndex((s: any) => s.id === studentId);
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Student not assigned to this grade',
        timestamp: new Date().toISOString(),
        endpoint: `/${gradeId}/remove-student/${studentId}`
      });
    }
    
    grades[gradeIndex].students.splice(studentIndex, 1);
    localStorage.setItem('grades', JSON.stringify(grades));
    
    res.json({
      success: true,
      message: 'Student removed from grade successfully',
      data: {
        grade_id: gradeId,
        student_id: studentId,
        removed_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      endpoint: `/${gradeId}/remove-student/${studentId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove student from grade',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.gradeId}/remove-student/${req.params.studentId}`
    });
  }
});

// Delete grade
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const gradeIdParam = req.params.id;
    const gradeId = parseInt(Array.isArray(gradeIdParam) ? gradeIdParam[0] : gradeIdParam);
    
    const grades = JSON.parse(localStorage.getItem('grades') || '[]');
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
    
    // Remove the grade
    grades.splice(gradeIndex, 1);
    localStorage.setItem('grades', JSON.stringify(grades));
    
    res.json({
      success: true,
      message: 'Grade deleted successfully',
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
router.delete('/', (req: Request, res: Response) => {
  try {
    localStorage.setItem('grades', JSON.stringify([]));
    
    res.json({
      success: true,
      message: 'All grades cleared successfully',
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

export default router;
