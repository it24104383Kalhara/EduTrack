import express from 'express';
import { MarksModel, Mark, MarkWithDetails, StudentResult } from '../models/Marks';
import { StudentModel } from '../models/Student';
import { GradeModel } from '../models/Grade';
import { SubjectModel } from '../models/Subject';
import { EmailService } from '../services/EmailService';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const emailService = new EmailService();

// Create new mark
router.post('/', async (req: AuthRequest, res) => {
  try {
    const markData: Omit<Mark, 'id' | 'percentage' | 'grade_obtained' | 'created_at' | 'updated_at'> = req.body;
    
    // Validate required fields
    const requiredFields = ['student_id', 'subject_id', 'grade_id', 'term', 'exam_type', 'marks_obtained', 'max_marks', 'exam_date'];
    for (const field of requiredFields) {
      if (!markData[field as keyof typeof markData]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
          data: null,
          timestamp: new Date().toISOString(),
          endpoint: '/api/marks'
        });
      }
    }

    // Validate marks range (skip for "AB")
    if (markData.marks_obtained !== "AB") {
      const marksNum = parseFloat(markData.marks_obtained.toString());
      if (isNaN(marksNum) || marksNum < 0 || marksNum > markData.max_marks) {
        return res.status(400).json({
          success: false,
          message: 'Marks obtained must be between 0 and maximum marks, or "AB" for absent',
          data: null,
          timestamp: new Date().toISOString(),
          endpoint: '/api/marks'
        });
      }
    }

    // Check if student exists
    const student = await StudentModel.findById(markData.student_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks'
      });
    }

    // Check if grade exists
    const grade = await GradeModel.findById(markData.grade_id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks'
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher' && grade.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this class.',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks'
      });
    }

    // Check if subject exists
    const subject = await SubjectModel.findById(markData.subject_id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks'
      });
    }

    const createdMark = await MarksModel.create(markData);
    
    // low_mark_alert_sent boolean removed since it is handled asynchronously by MarksModel
    
    res.status(201).json({
      success: true,
      message: 'Mark created successfully',
      data: createdMark,
      timestamp: new Date().toISOString(),
      endpoint: '/api/marks'
    });
  } catch (error) {
    console.error('Error creating mark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mark',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/marks'
    });
  }
});

// Bulk create marks for multiple students
router.post('/bulk', async (req: AuthRequest, res) => {
  try {
    const { marks_data } = req.body;
    
    if (!Array.isArray(marks_data) || marks_data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'marks_data must be a non-empty array',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks/bulk'
      });
    }

    const results = [];
    const errors = [];

    for (const markData of marks_data) {
      try {
        // Validate required fields
        const requiredFields = ['student_id', 'subject_id', 'grade_id', 'term', 'exam_type', 'marks_obtained', 'max_marks', 'exam_date'];
        for (const field of requiredFields) {
          if (!markData[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Validate marks range
        if (markData.marks_obtained !== "AB") {
          const marksNum = parseFloat(markData.marks_obtained.toString());
          if (isNaN(marksNum) || marksNum < 0 || marksNum > markData.max_marks) {
            throw new Error('Marks obtained must be between 0 and maximum marks, or "AB" for absent');
          }
        }

        // Check if mark already exists
        const existingMark = await MarksModel.findByUniqueKey(
          markData.student_id, 
          markData.subject_id, 
          markData.grade_id, 
          markData.term, 
          markData.exam_type
        );

        let savedMark;
        if (existingMark) {
          // Update existing mark
          savedMark = await MarksModel.update(existingMark.id!, {
            marks_obtained: markData.marks_obtained,
            max_marks: markData.max_marks,
            remarks: markData.remarks,
            exam_date: markData.exam_date
          });
          console.log(`Updated existing mark for student ${markData.student_id}`);
        } else {
          // Create new mark
          try {
            savedMark = await MarksModel.create(markData);
            console.log(`Created new mark for student ${markData.student_id}`);
          } catch (createError: any) {
            // If create fails due to duplicate (race condition), try to find and update
            if (createError.code === 'ER_DUP_ENTRY' || createError.errno === 1062) {
              console.log(`Race condition duplicate for student ${markData.student_id}, finding existing mark...`);
              const retryExistingMark = await MarksModel.findByUniqueKey(
                markData.student_id, 
                markData.subject_id, 
                markData.grade_id, 
                markData.term, 
                markData.exam_type
              );
              if (retryExistingMark) {
                savedMark = await MarksModel.update(retryExistingMark.id!, {
                  marks_obtained: markData.marks_obtained,
                  max_marks: markData.max_marks,
                  remarks: markData.remarks,
                  exam_date: markData.exam_date
                });
                console.log(`Updated existing mark after race condition for student ${markData.student_id}`);
              } else {
                throw createError;
              }
            } else {
              throw createError;
            }
          }
        }
        
        results.push(savedMark!);
        
      } catch (error) {
        console.error(`Error saving mark for student ${markData.student_id}:`, error);
        errors.push({
          student_id: markData.student_id,
          subject_id: markData.subject_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk mark creation completed. ${results.length} created, ${errors.length} failed`,
      data: {
        created: results,
        errors: errors
      },
      timestamp: new Date().toISOString(),
      endpoint: '/api/marks/bulk'
    });
  } catch (error) {
    console.error('Error in bulk mark creation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create marks in bulk',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/marks/bulk'
    });
  }
});

// Get mark by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mark ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/${id}`
      });
    }

    const mark = await MarksModel.findById(id);
    
    // If teacher, verify they own the grade associated with this mark
    if (req.user?.role === 'teacher' && mark) {
      const grade = await GradeModel.findById(mark.grade_id);
      if (!grade || grade.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to this class.',
          data: null,
          timestamp: new Date().toISOString(),
          endpoint: `/api/marks/${id}`
        });
      }
    }
    
    if (!mark) {
      return res.status(404).json({
        success: false,
        message: 'Mark not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/${id}`
      });
    }

    res.json({
      success: true,
      message: 'Mark retrieved successfully',
      data: mark,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${id}`
    });
  } catch (error) {
    console.error('Error retrieving mark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mark',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${req.params.id}`
    });
  }
});

// Get marks by student, grade, and term
router.get('/student/:studentId/grade/:gradeId/term/:term', async (req, res) => {
  try {
    const studentId = parseInt(String(req.params.studentId));
    const gradeId = parseInt(String(req.params.gradeId));
    const term = String(req.params.term);
    
    if (isNaN(studentId) || isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID or grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/student/${studentId}/grade/${gradeId}/term/${term}`
      });
    }

    const marks = await MarksModel.findByStudentGradeTerm(studentId, gradeId, term);
    
    res.json({
      success: true,
      message: 'Marks retrieved successfully',
      data: marks,
      count: marks.length,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/student/${studentId}/grade/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error retrieving marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve marks',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/student/${req.params.studentId}/grade/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Get marks by grade, subject, and term
router.get('/grade/:gradeId/subject/:subjectId/term/:term', async (req: AuthRequest, res) => {
  try {
    const gradeId = parseInt(String(req.params.gradeId));
    const subjectId = parseInt(String(req.params.subjectId));
    const term = String(req.params.term);
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/grade/${gradeId}/subject/${subjectId}/term/${term}`
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher') {
      const grade = await GradeModel.findById(gradeId);
      if (!grade || grade.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to this class.',
          data: null,
          timestamp: new Date().toISOString(),
          endpoint: `/api/marks/grade/${gradeId}/subject/${subjectId}/term/${term}`
        });
      }
    }

    const marks = await MarksModel.findByGradeSubjectTerm(gradeId, subjectId, term);
    
    res.json({
      success: true,
      message: 'Marks retrieved successfully',
      data: marks,
      count: marks.length,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/grade/${gradeId}/subject/${req.params.subjectId}/term/${term}`
    });
  } catch (error) {
    console.error('Error retrieving marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve marks',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/grade/${req.params.gradeId}/subject/${req.params.subjectId}/term/${req.params.term}`
    });
  }
});

// Get all marks by grade and term
router.get('/grade/:gradeId/term/:term', async (req: AuthRequest, res) => {
  try {
    const gradeId = parseInt(String(req.params.gradeId));
    const term = String(req.params.term);
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/grade/${gradeId}/term/${term}`
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher') {
      const grade = await GradeModel.findById(gradeId);
      if (!grade || grade.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to this class.',
          data: null,
          timestamp: new Date().toISOString(),
          endpoint: `/api/marks/grade/${gradeId}/term/${term}`
        });
      }
    }

    const marks = await MarksModel.findByGradeTerm(gradeId, term);
    
    res.json({
      success: true,
      message: 'Marks retrieved successfully',
      data: marks,
      count: marks.length,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/grade/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error retrieving marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve marks',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/grade/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Update mark
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Partial<Mark> = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mark ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/${id}`
      });
    }

    // Validate marks range if provided (skip for "AB")
    if (updates.marks_obtained !== undefined && updates.max_marks !== undefined) {
      if (updates.marks_obtained !== "AB") {
        const marksNum = Number(updates.marks_obtained);
        if (isNaN(marksNum) || marksNum < 0 || marksNum > updates.max_marks) {
          return res.status(400).json({
            success: false,
            message: 'Marks obtained must be between 0 and maximum marks, or "AB" for absent',
            data: null,
            timestamp: new Date().toISOString(),
            endpoint: '/api/marks'
          });
        }
      }
    }

    const updatedMark = await MarksModel.update(id, updates);
    
    if (!updatedMark) {
      return res.status(404).json({
        success: false,
        message: 'Mark not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/${id}`
      });
    }

    // Check if low mark alert should be sent after update
    // Removed redundant low mark alert trigger; MarksModel handles it asynchronously.

    res.json({
      success: true,
      message: 'Mark updated successfully',
      data: updatedMark,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${id}`
    });
  } catch (error) {
    console.error('Error updating mark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mark',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${req.params.id}`
    });
  }
});

// Delete mark
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mark ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/${id}`
      });
    }

    const deleted = await MarksModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Mark not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/${id}`
      });
    }

    res.json({
      success: true,
      message: 'Mark deleted successfully',
      data: { deleted: true },
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${id}`
    });
  } catch (error) {
    console.error('Error deleting mark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mark',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${req.params.id}`
    });
  }
});

// Calculate student result
router.get('/result/student/:studentId/grade/:gradeId/term/:term', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const gradeId = parseInt(req.params.gradeId);
    const term = req.params.term;
    
    if (isNaN(studentId) || isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID or grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/result/student/${studentId}/grade/${gradeId}/term/${term}`
      });
    }

    const result = await MarksModel.calculateStudentResult(studentId, gradeId, term);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No marks found for this student in the specified grade and term',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/result/student/${studentId}/grade/${gradeId}/term/${term}`
      });
    }

    res.json({
      success: true,
      message: 'Student result calculated successfully',
      data: result,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/result/student/${studentId}/grade/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error calculating student result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate student result',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/result/student/${req.params.studentId}/grade/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Get low marks (below threshold)
router.get('/low-marks/threshold/:threshold', async (req, res) => {
  try {
    const threshold = parseFloat(req.params.threshold);
    
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be a number between 0 and 100',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/low-marks/threshold/${threshold}`
      });
    }

    const lowMarks = await MarksModel.getLowMarks(threshold);
    
    res.json({
      success: true,
      message: `Low marks (below ${threshold}%) retrieved successfully`,
      data: lowMarks,
      count: lowMarks.length,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/low-marks/threshold/${threshold}`
    });
  } catch (error) {
    console.error('Error retrieving low marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low marks',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/low-marks/threshold/${req.params.threshold}`
    });
  }
});

// Get grade statistics
router.get('/statistics/grade/:gradeId/term/:term', async (req, res) => {
  try {
    const gradeId = parseInt(req.params.gradeId);
    const term = req.params.term;
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/statistics/grade/${gradeId}/term/${term}`
      });
    }

    const statistics = await MarksModel.getGradeStatistics(gradeId, term);
    
    res.json({
      success: true,
      message: 'Grade statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/statistics/grade/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error retrieving grade statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve grade statistics',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/statistics/grade/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Get all grades performance statistics
router.get('/statistics/all-grades/:term', async (req: AuthRequest, res) => {
  try {
    const term = req.params.term as string;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    // If teacher, only fetch stats for their assigned class
    const teacherId = userRole === 'teacher' ? userId : undefined;
    const statistics = await MarksModel.getAllGradesPerformance(term, teacherId);
    
    res.json({
      success: true,
      message: 'All grades performance statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/statistics/all-grades/${term}`
    });
  } catch (error) {
    console.error('Error retrieving all grades performance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve all grades performance statistics',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/statistics/all-grades/${req.params.term}`
    });
  }
});

// Send consolidated term reports
router.post('/grade/:gradeId/term/:term/send-reports', async (req, res) => {
  try {
    const gradeId = parseInt(req.params.gradeId);
    const term = req.params.term;
    const { examType } = req.body;
    
    if (isNaN(gradeId) || !term) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID or term',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/grade/${gradeId}/term/${term}/send-reports`
      });
    }

    await MarksModel.sendBulkConsolidatedReports(gradeId, term, examType || 'final_term');
    
    res.json({
      success: true,
      message: 'Consolidated reports sent successfully',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/grade/${gradeId}/term/${term}/send-reports`
    });
  } catch (error) {
    console.error('Error sending reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reports',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/grade/${req.params.gradeId}/term/${req.params.term}/send-reports`
    });
  }
});

// Send low mark alerts manually
router.post('/send-low-mark-alerts', async (req, res) => {
  try {
    const { threshold } = req.body;
    const alertThreshold = threshold || 40;
    
    if (typeof alertThreshold !== 'number' || alertThreshold < 0 || alertThreshold > 100) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be a number between 0 and 100',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks/send-low-mark-alerts'
      });
    }

    const results = await emailService.checkAndSendLowMarksAlerts(alertThreshold);
    
    res.json({
      success: true,
      message: 'Low mark alerts processed successfully',
      data: results,
      timestamp: new Date().toISOString(),
      endpoint: '/api/marks/send-low-mark-alerts'
    });
  } catch (error) {
    console.error('Error sending low mark alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send low mark alerts',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/marks/send-low-mark-alerts'
    });
  }
});

// Test email configuration
router.post('/test-email', async (req, res) => {
  try {
    const success = await emailService.testEmailConfiguration();
    
    if (success) {
      res.json({
        success: true,
        message: 'Email configuration test successful',
        data: { test_passed: true },
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks/test-email'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email configuration test failed',
        data: { test_passed: false },
        timestamp: new Date().toISOString(),
        endpoint: '/api/marks/test-email'
      });
    }
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/marks/test-email'
    });
  }
});

// Send low mark alert for specific mark
router.post('/:id/send-low-mark-alert', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mark ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/marks/${id}/send-low-mark-alert`
      });
    }

    const result = await emailService.checkAndSendLowMarkAlert(id);
    
    res.json({
      success: true,
      message: result.alertSent ? 'Low mark alert sent successfully' : 'Low mark alert not sent',
      data: {
        markId: id,
        alertSent: result.alertSent,
        emailLog: result.emailLog,
        error: result.error
      },
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${id}/send-low-mark-alert`
    });
  } catch (error) {
    console.error('Error sending low mark alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send low mark alert',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/marks/${req.params.id}/send-low-mark-alert`
    });
  }
});

export default router;

