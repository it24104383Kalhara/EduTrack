import { Router, Request, Response } from 'express';
import { AttendanceModel } from '../models/Attendance';
import { GradeModel } from '../models/Grade';
import { AuthRequest } from '../middleware/auth';

// ============================================================================
// ATTENDANCE API ROUTES
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Complete CRUD operations for attendance management
// ============================================================================

const router = Router();

// ============================================================================
// ENDPOINT: POST /api/attendance/mark
// PURPOSE: Mark attendance for multiple students in a grade
// ACCESS: Public
// ============================================================================
router.post('/mark', async (req: AuthRequest, res: Response) => {
  try {
    const { grade_id, date, attendance_data, marked_by } = req.body;
    
    // Validate required fields
    if (!grade_id || !date || !attendance_data || !Array.isArray(attendance_data)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'grade_id, date, and attendance_data array are required',
        timestamp: new Date().toISOString(),
        endpoint: '/mark'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        error: 'Date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        endpoint: '/mark'
      });
    }

    // Get grade information
    const grade = await GradeModel.findById(grade_id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${grade_id} exists`,
        timestamp: new Date().toISOString(),
        endpoint: '/mark'
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher' && grade.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this class.',
        timestamp: new Date().toISOString(),
        endpoint: '/mark'
      });
    }

    // Prepare attendance records
    const attendanceRecords = attendance_data.map((record: any) => ({
      grade_id: grade_id,
      grade: grade.grade,
      section: grade.grade_part,
      student_id: record.student_id,
      student_name: record.student_name,
      date: date,
      status: record.status,
      marked_by: marked_by || 'System',
      notes: record.notes || null
    }));

    // Validate status values
    const validStatuses = ['present', 'absent', 'late'];
    for (const record of attendanceRecords) {
      if (!validStatuses.includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attendance status',
          error: `Status must be one of: ${validStatuses.join(', ')}`,
          timestamp: new Date().toISOString(),
          endpoint: '/mark'
        });
      }
    }

    // Mark attendance
    await AttendanceModel.markAttendanceBulk(attendanceRecords);
    
    // Get attendance summary
    const summary = await AttendanceModel.getAttendanceSummary(grade_id, date);
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        grade_id,
        date,
        marked_students: attendanceRecords.length,
        summary
      },
      timestamp: new Date().toISOString(),
      endpoint: '/mark'
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_MARK_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/mark'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance/grade/:grade_id/date/:date
// PURPOSE: Get attendance for a specific grade and date
// ACCESS: Public
// ============================================================================
router.get('/grade/:grade_id/date/:date', async (req: AuthRequest, res: Response) => {
  try {
    const gradeId = parseInt(Array.isArray(req.params.grade_id) ? req.params.grade_id[0] : req.params.grade_id);
    const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    
    // Validate grade ID
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID format',
        error: 'Grade ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        error: 'Date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // Check if grade exists
    const grade = await GradeModel.findById(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher' && grade.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this class.',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // Get attendance records
    const attendance = await AttendanceModel.getAttendanceByGradeAndDate(gradeId, date);
    
    // Get attendance summary
    const summary = await AttendanceModel.getAttendanceSummary(gradeId, date);
    
    res.status(200).json({
      success: true,
      message: 'Attendance retrieved successfully',
      data: {
        grade: {
          id: grade.id,
          grade: grade.grade,
          grade_part: grade.grade_part
        },
        date,
        summary,
        attendance
      },
      count: attendance.length,
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${gradeId}/date/${date}`
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_GET_GRADE_DATE_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${req.params.grade_id}/date/${req.params.date}`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance/grade/:grade_id/dates
// PURPOSE: Get all attendance dates for a grade
// ACCESS: Public
// ============================================================================
router.get('/grade/:grade_id/dates', async (req: AuthRequest, res: Response) => {
  try {
    const gradeId = parseInt(Array.isArray(req.params.grade_id) ? req.params.grade_id[0] : req.params.grade_id);
    
    // Validate grade ID
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID format',
        error: 'Grade ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/dates`
      });
    }

    // Check if grade exists
    const grade = await GradeModel.findById(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/dates`
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher' && grade.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this class.',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/dates`
      });
    }

    // Get attendance dates
    const dates = await AttendanceModel.getAttendanceDates(gradeId);
    
    res.status(200).json({
      success: true,
      message: 'Attendance dates retrieved successfully',
      data: {
        grade: {
          id: grade.id,
          grade: grade.grade,
          grade_part: grade.grade_part
        },
        dates
      },
      count: dates.length,
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${gradeId}/dates`
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_GET_DATES_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance dates',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${req.params.grade_id}/dates`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance/student/:student_id/report
// PURPOSE: Get attendance report for a specific student
// ACCESS: Public
// ============================================================================
router.get('/student/:student_id/report', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(Array.isArray(req.params.student_id) ? req.params.student_id[0] : req.params.student_id);
    const { start_date, end_date } = req.query;
    
    // Validate student ID
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
        error: 'Student ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/student/${studentId}/report`
      });
    }

    // Validate date formats if provided
    if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format',
        error: 'Start date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        endpoint: `/student/${studentId}/report`
      });
    }

    if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format',
        error: 'End date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        endpoint: `/student/${studentId}/report`
      });
    }

    // Get student attendance report
    const report = await AttendanceModel.getStudentAttendanceReport(
      studentId, 
      start_date as string, 
      end_date as string
    );
    
    res.status(200).json({
      success: true,
      message: 'Student attendance report retrieved successfully',
      data: {
        student_id: studentId,
        date_range: {
          start_date: start_date || null,
          end_date: end_date || null
        },
        report
      },
      timestamp: new Date().toISOString(),
      endpoint: `/student/${studentId}/report`
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_STUDENT_REPORT_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student attendance report',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/student/${req.params.student_id}/report`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance/grade/:grade_id/report
// PURPOSE: Get attendance report for all students in a grade
// ACCESS: Public
// ============================================================================
router.get('/grade/:grade_id/report', async (req: AuthRequest, res: Response) => {
  try {
    const gradeId = parseInt(Array.isArray(req.params.grade_id) ? req.params.grade_id[0] : req.params.grade_id);
    const { start_date, end_date } = req.query;
    
    // Validate grade ID
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID format',
        error: 'Grade ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/report`
      });
    }

    // Check if grade exists
    const grade = await GradeModel.findById(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/report`
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher' && grade.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this class.',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/report`
      });
    }

    // Validate date formats if provided
    if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format',
        error: 'Start date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/report`
      });
    }

    if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format',
        error: 'End date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/report`
      });
    }

    // Get grade attendance report
    const report = await AttendanceModel.getGradeAttendanceReport(
      gradeId, 
      start_date as string, 
      end_date as string
    );
    
    res.status(200).json({
      success: true,
      message: 'Grade attendance report retrieved successfully',
      data: {
        grade: {
          id: grade.id,
          grade: grade.grade,
          grade_part: grade.grade_part
        },
        date_range: {
          start_date: start_date || null,
          end_date: end_date || null
        },
        report
      },
      count: report.length,
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${gradeId}/report`
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_GRADE_REPORT_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get grade attendance report',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${req.params.grade_id}/report`
    });
  }
});

// ============================================================================
// ENDPOINT: DELETE /api/attendance/grade/:grade_id/date/:date
// PURPOSE: Delete all attendance records for a grade on a specific date
// ACCESS: Public
// ============================================================================
router.delete('/grade/:grade_id/date/:date', async (req: AuthRequest, res: Response) => {
  try {
    const gradeId = parseInt(Array.isArray(req.params.grade_id) ? req.params.grade_id[0] : req.params.grade_id);
    const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    
    // Validate grade ID
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID format',
        error: 'Grade ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        error: 'Date must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // Check if grade exists
    const grade = await GradeModel.findById(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
        error: `No grade with ID ${gradeId} exists`,
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // If teacher, verify they own this grade
    if (req.user?.role === 'teacher' && grade.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this class.',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }

    // Delete attendance records
    const deleted = await AttendanceModel.deleteAttendance(gradeId, date);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Attendance records deleted successfully',
        data: {
          grade_id: gradeId,
          date,
          deleted_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No attendance records found to delete',
        error: 'No attendance records exist for this grade and date',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${gradeId}/date/${date}`
      });
    }
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_DELETE_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance records',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${req.params.grade_id}/date/${req.params.date}`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance/statistics
// PURPOSE: Get overall attendance statistics
// ACCESS: Public
// ============================================================================
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await AttendanceModel.getStatistics();
    
    res.status(200).json({
      success: true,
      message: 'Attendance statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
      endpoint: '/statistics'
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_STATISTICS_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/statistics'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance/weekly-trends
// PURPOSE: Get weekly attendance trends
// ACCESS: Public
// ============================================================================
router.get('/weekly-trends', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    // If teacher, only fetch trends for their assigned class
    const teacherId = userRole === 'teacher' ? userId : undefined;
    const trends = await AttendanceModel.getWeeklyAttendanceTrends(teacherId);
    
    res.status(200).json({
      success: true,
      message: 'Weekly attendance trends retrieved successfully',
      data: trends,
      timestamp: new Date().toISOString(),
      endpoint: '/weekly-trends'
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_WEEKLY_TRENDS_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly attendance trends',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/weekly-trends'
    });
  }
});

// ============================================================================
// EXPORT ATTENDANCE ROUTER
// ============================================================================
// Usage: app.use('/api/attendance', attendanceRoutes);
// ============================================================================
export default router;
