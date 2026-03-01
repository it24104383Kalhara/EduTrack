import { Router, Request, Response } from 'express';
import { AttendanceMarkModel } from '../models/AttendanceMark';
import { GradeModel } from '../models/Grade';

// ============================================================================
// ATTENDANCE MARK API ROUTES
// ============================================================================
// Version: 1.0.0 | Production Ready
// Author: EduTrack Development Team
// Description: Complete CRUD operations for attendance marking
// ============================================================================

const router = Router();

// ============================================================================
// ENDPOINT: POST /api/attendance-mark/mark
// PURPOSE: Mark attendance for a student
// ACCESS: Public
// ============================================================================
router.post('/mark', async (req: Request, res: Response) => {
  try {
    const { student_id, student_name, grade, section, status, marked_date, marked_time, marked_by } = req.body;
    
    // Validate required fields
    if (!student_id || !student_name || !grade || !section || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'student_id, student_name, grade, section, and status are required',
        timestamp: new Date().toISOString(),
        endpoint: '/mark'
      });
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        error: `Status must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString(),
        endpoint: '/mark'
      });
    }

    // Mark attendance
    const attendance = await AttendanceMarkModel.markAttendance({
      student_id,
      student_name,
      grade,
      section,
      status,
      marked_date,
      marked_time,
      marked_by
    });
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
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
// ENDPOINT: POST /api/attendance-mark/bulk-mark
// PURPOSE: Mark attendance for multiple students
// ACCESS: Public
// ============================================================================
router.post('/bulk-mark', async (req: Request, res: Response) => {
  try {
    const { attendance_records } = req.body;
    
    // Validate required fields
    if (!attendance_records || !Array.isArray(attendance_records)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'attendance_records array is required',
        timestamp: new Date().toISOString(),
        endpoint: '/bulk-mark'
      });
    }

    // Validate each record
    for (const record of attendance_records) {
      if (!record.student_id || !record.student_name || !record.grade || !record.section || !record.status) {
        return res.status(400).json({
          success: false,
          message: 'Invalid record format',
          error: 'Each record must have student_id, student_name, grade, section, and status',
          timestamp: new Date().toISOString(),
          endpoint: '/bulk-mark'
        });
      }

      const validStatuses = ['present', 'absent', 'late'];
      if (!validStatuses.includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          error: `Status must be one of: ${validStatuses.join(', ')}`,
          timestamp: new Date().toISOString(),
          endpoint: '/bulk-mark'
        });
      }
    }

    // Bulk mark attendance
    await AttendanceMarkModel.bulkMarkAttendance(attendance_records);
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully for all students',
      data: {
        marked_students: attendance_records.length
      },
      timestamp: new Date().toISOString(),
      endpoint: '/bulk-mark'
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_BULK_MARK_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk mark attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/bulk-mark'
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance-mark/grade/:grade/section/:section/date/:date
// PURPOSE: Get attendance for a specific grade, section, and date
// ACCESS: Public
// ============================================================================
router.get('/grade/:grade/section/:section/date/:date', async (req: Request, res: Response) => {
  try {
    const grade = parseInt(Array.isArray(req.params.grade) ? req.params.grade[0] : req.params.grade);
    const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
    const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    
    // Validate grade
    if (isNaN(grade)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade format',
        error: 'Grade must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${grade}/section/${section}/date/${date}`
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
        endpoint: `/grade/${grade}/section/${section}/date/${date}`
      });
    }

    // Get attendance records
    const attendance = await AttendanceMarkModel.getAttendanceByGradeAndDate(grade, section, date);
    
    // Get attendance summary
    const summary = await AttendanceMarkModel.getAttendanceSummary(grade, section, date);
    
    res.status(200).json({
      success: true,
      message: 'Attendance retrieved successfully',
      data: {
        grade,
        section,
        date,
        summary,
        attendance
      },
      count: attendance.length,
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${grade}/section/${section}/date/${date}`
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_GET_GRADE_SECTION_DATE_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${req.params.grade}/section/${req.params.section}/date/${req.params.date}`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance-mark/student/:student_id
// PURPOSE: Get all attendance records for a specific student
// ACCESS: Public
// ============================================================================
router.get('/student/:student_id', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(Array.isArray(req.params.student_id) ? req.params.student_id[0] : req.params.student_id);
    
    // Validate student ID
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
        error: 'Student ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/student/${studentId}`
      });
    }

    // Get student attendance
    const attendance = await AttendanceMarkModel.getAttendanceByStudent(studentId);
    
    res.status(200).json({
      success: true,
      message: 'Student attendance retrieved successfully',
      data: {
        student_id: studentId,
        attendance
      },
      count: attendance.length,
      timestamp: new Date().toISOString(),
      endpoint: `/student/${studentId}`
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_GET_STUDENT_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/student/${req.params.student_id}`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance-mark/all
// PURPOSE: Get all attendance records
// ACCESS: Public
// ============================================================================
router.get('/all', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let attendance;
    if (start_date && end_date) {
      // Get attendance by date range
      attendance = await AttendanceMarkModel.getAttendanceByDateRange(
        start_date as string, 
        end_date as string
      );
    } else {
      // Get all attendance
      attendance = await AttendanceMarkModel.getAllAttendance();
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: {
        date_range: start_date && end_date ? { start_date, end_date } : null,
        attendance
      },
      count: attendance.length,
      timestamp: new Date().toISOString(),
      endpoint: '/all'
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_GET_ALL_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance records',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/all'
    });
  }
});

// ============================================================================
// ENDPOINT: PUT /api/attendance-mark/update/:student_id/:date
// PURPOSE: Update attendance status for a student on a specific date
// ACCESS: Public
// ============================================================================
router.put('/update/:student_id/:date', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(Array.isArray(req.params.student_id) ? req.params.student_id[0] : req.params.student_id);
    const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const { status, marked_by } = req.body;
    
    // Validate student ID
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
        error: 'Student ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/update/${studentId}/${date}`
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
        endpoint: `/update/${studentId}/${date}`
      });
    }

    // Validate status
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Missing status',
        error: 'Status is required',
        timestamp: new Date().toISOString(),
        endpoint: `/update/${studentId}/${date}`
      });
    }

    const validStatuses = ['present', 'absent', 'late'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        error: `Status must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString(),
        endpoint: `/update/${studentId}/${date}`
      });
    }

    // Update attendance
    const attendance = await AttendanceMarkModel.updateAttendanceStatus(
      studentId, 
      date, 
      status as 'present' | 'absent' | 'late',
      marked_by
    );
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
        error: `No attendance record found for student ${studentId} on date ${date}`,
        timestamp: new Date().toISOString(),
        endpoint: `/update/${studentId}/${date}`
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance,
      timestamp: new Date().toISOString(),
      endpoint: `/update/${studentId}/${date}`
    });
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_UPDATE_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/update/${req.params.student_id}/${req.params.date}`
    });
  }
});

// ============================================================================
// ENDPOINT: DELETE /api/attendance-mark/grade/:grade/section/:section/date/:date
// PURPOSE: Delete all attendance records for a specific grade and date
// ACCESS: Public
// ============================================================================
router.delete('/grade/:grade/section/:section/date/:date', async (req: Request, res: Response) => {
  try {
    const grade = parseInt(Array.isArray(req.params.grade) ? req.params.grade[0] : req.params.grade);
    const section = Array.isArray(req.params.section) ? req.params.section[0] : req.params.section;
    const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    
    // Validate grade
    if (isNaN(grade)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade format',
        error: 'Grade must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${grade}/section/${section}/date/${date}`
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
        endpoint: `/grade/${grade}/section/${section}/date/${date}`
      });
    }

    // Delete all attendance records for this grade and date
    const deleted = await AttendanceMarkModel.deleteAttendanceByGradeAndDate(grade, section, date);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Attendance records deleted successfully',
        data: {
          grade,
          section,
          date,
          deleted_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${grade}/section/${section}/date/${date}`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No attendance records found to delete',
        error: `No attendance records found for grade ${grade}-${section} on date ${date}`,
        timestamp: new Date().toISOString(),
        endpoint: `/grade/${grade}/section/${section}/date/${date}`
      });
    }
  } catch (error) {
    console.error('🔴 [ATTENDANCE_DELETE_GRADE_DATE_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance records',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/grade/${req.params.grade}/section/${req.params.section}/date/${req.params.date}`
    });
  }
});

// ============================================================================
// ENDPOINT: DELETE /api/attendance-mark/:student_id/:date
// PURPOSE: Delete attendance record for a student on a specific date
// ACCESS: Public
// ============================================================================
router.delete('/:student_id/:date', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(Array.isArray(req.params.student_id) ? req.params.student_id[0] : req.params.student_id);
    const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    
    // Validate student ID
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
        error: 'Student ID must be a valid number',
        timestamp: new Date().toISOString(),
        endpoint: `/${studentId}/${date}`
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
        endpoint: `/${studentId}/${date}`
      });
    }

    // Delete attendance record
    const deleted = await AttendanceMarkModel.deleteAttendance(studentId, date);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Attendance record deleted successfully',
        data: {
          student_id: studentId,
          date,
          deleted_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        endpoint: `/${studentId}/${date}`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Attendance record not found',
        error: `No attendance record found for student ${studentId} on date ${date}`,
        timestamp: new Date().toISOString(),
        endpoint: `/${studentId}/${date}`
      });
    }
    
  } catch (error) {
    console.error('🔴 [ATTENDANCE_DELETE_ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: `/${req.params.student_id}/${req.params.date}`
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/attendance-mark/statistics
// PURPOSE: Get attendance statistics
// ACCESS: Public
// ============================================================================
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await AttendanceMarkModel.getStatistics();
    
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
// EXPORT ATTENDANCE MARK ROUTER
// ============================================================================
// Usage: app.use('/api/attendance-mark', attendanceMarkRoutes);
// ============================================================================
export default router;
