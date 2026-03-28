import express, { Response } from 'express';
import { EmailLogModel, EmailLog } from '../models/EmailLog';
import { StudentModel } from '../models/Student';
import { MarksModel } from '../models/Marks';
import { SubjectModel } from '../models/Subject';
import { GradeModel } from '../models/Grade';
import { pool } from '../models/EmailLog';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

export interface EmailLogWithDetails extends EmailLog {
  student_name: string;
  subject_name?: string;
  subject_code?: string;
  grade_name?: string;
  marks_obtained?: number;
  max_marks?: number;
  percentage?: number;
  exam_type?: string;
  exam_date?: string;
}

// Get email alert logs with student details
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      student_id,
      start_date,
      end_date,
      student_name
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    // Build WHERE conditions
    let whereConditions = [];
    let queryParams: any[] = [];

    // Role-based filtering
    if (req.user?.role === 'teacher') {
      whereConditions.push('g.teacher_id = ?');
      queryParams.push(req.user.id);
    }

    if (status) {
      whereConditions.push('el.status = ?');
      queryParams.push(status);
    }

    if (student_id) {
      whereConditions.push('el.student_id = ?');
      queryParams.push(student_id);
    }

    if (start_date) {
      whereConditions.push('DATE(el.created_at) >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(el.created_at) <= ?');
      queryParams.push(end_date);
    }

    if (student_name) {
      whereConditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR el.student_name LIKE ?)`);
      const term = `%${student_name}%`;
      queryParams.push(term, term, term, term);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main query to get email logs with student details
    const query = `
      SELECT 
        el.id,
        el.mark_id,
        el.student_id,
        COALESCE(el.student_name, CONCAT(s.first_name, ' ', s.last_name)) as student_name,
        COALESCE(el.student_class, CONCAT(g.grade, '-', g.grade_part)) as student_class,
        el.parent_email,
        el.email_type,
        el.status,
        el.error_message,
        COALESCE(el.failed_subjects_count, 0) as failed_subjects_count,
        el.sent_at,
        el.created_at,
        m.exam_type
      FROM email_logs el
      LEFT JOIN students s ON el.student_id = s.id
      LEFT JOIN marks m ON el.mark_id = m.id
      LEFT JOIN grades g ON m.grade_id = g.id
      ${whereClause}
      ORDER BY el.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM email_logs el
      LEFT JOIN students s ON el.student_id = s.id
      LEFT JOIN marks m ON el.mark_id = m.id
      LEFT JOIN grades g ON m.grade_id = g.id
      ${whereClause}
    `;

    const countParams = queryParams; // Use same params for count query

    try {
      // Execute main query
      const [rows] = await pool.execute(query, queryParams) as any;

      // Execute count query
      const [countRows] = await pool.execute(countQuery, countParams) as any;
      const total = countRows[0].total;

      // Transform data
      const logs: EmailLogWithDetails[] = rows.map((row: any) => ({
        id: row.id,
        mark_id: row.mark_id,
        student_id: row.student_id,
        parent_email: row.parent_email,
        email_type: row.email_type,
        status: row.status,
        error_message: row.error_message,
        failed_subjects_count: row.failed_subjects_count ?? 0,
        sent_at: row.sent_at,
        created_at: row.created_at,
        student_name: row.student_name?.trim() || 'Unknown Student',
        student_class: row.student_class || 'Unknown',
        grade_name: row.student_class || 'Unknown',
        exam_type: row.exam_type || 'Unknown',
      }));

      res.json({
        success: true,
        message: 'Email logs retrieved successfully',
        data: {
          logs,
          pagination: {
            current_page: Number(page),
            per_page: limitNum,
            total: total,
            total_pages: Math.ceil(total / limitNum),
            has_next: offset + limitNum < total,
            has_prev: Number(page) > 1
          }
        },
        timestamp: new Date().toISOString(),
        endpoint: '/api/email-alerts/logs'
      });
    } catch (error) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve email logs',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/email-alerts/logs'
      });
    }
  } catch (error) {
    console.error('Error in email logs endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/email-alerts/logs'
    });
  }
});

// Get email statistics
router.get('/statistics', async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Number(days);
    const userId = req.user?.id;
    const isTeacher = req.user?.role === 'teacher';

    const stats = await EmailLogModel.getEmailStatistics(daysNum, isTeacher ? userId : undefined);

    // Get additional statistics
    let detailedStatsQuery = `
      SELECT 
        el.status,
        COUNT(*) as count,
        DATE(el.created_at) as date
      FROM email_logs el
      ${isTeacher ? 'JOIN marks m ON el.mark_id = m.id JOIN grades g ON m.grade_id = g.id' : ''}
      WHERE el.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ${isTeacher ? 'AND g.teacher_id = ?' : ''}
      GROUP BY el.status, DATE(el.created_at)
      ORDER BY date DESC
    `;

    const detailParams: any[] = [daysNum];
    if (isTeacher) detailParams.push(userId);

    const [detailRows] = await pool.execute(detailedStatsQuery, detailParams) as [any[], any];

    // Get top students with most alerts
    let topStudentsQuery = `
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        COUNT(el.id) as alert_count
      FROM email_logs el
      JOIN students s ON el.student_id = s.id
      ${isTeacher ? 'JOIN marks m ON el.mark_id = m.id JOIN grades g ON m.grade_id = g.id' : ''}
      WHERE el.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ${isTeacher ? 'AND g.teacher_id = ?' : ''}
      GROUP BY s.id, s.first_name, s.last_name
      ORDER BY alert_count DESC
      LIMIT 10
    `;

    const topStudentsParams: any[] = [daysNum];
    if (isTeacher) topStudentsParams.push(userId);

    const [topStudentsRows] = await pool.execute(topStudentsQuery, topStudentsParams) as [any[], any];

    res.json({
      success: true,
      message: 'Email statistics retrieved successfully',
      data: {
        summary: stats,
        daily_breakdown: detailRows,
        top_students: topStudentsRows.map(row => ({
          student_id: row.id,
          student_name: `${row.first_name} ${row.last_name}`.trim(),
          alert_count: row.alert_count
        }))
      },
      timestamp: new Date().toISOString(),
      endpoint: '/api/email-alerts/statistics'
    });
  } catch (error) {
    console.error('Error fetching email statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email statistics',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/email-alerts/statistics'
    });
  }
});

// Get email logs by student
router.get('/student/:studentId', async (req: AuthRequest, res: Response) => {
  try {
    const studentIdStr = req.params.studentId;
    const studentId = parseInt(Array.isArray(studentIdStr) ? studentIdStr[0] : studentIdStr);
    const { limit = 50 } = req.query;
    const userId = req.user?.id;
    const isTeacher = req.user?.role === 'teacher';

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/email-alerts/student/${studentId}`
      });
    }

    // Verify teacher's access to this student
    if (isTeacher) {
      const [rows] = await pool.execute(`
        SELECT COUNT(*) as count 
        FROM student_assignment sa
        INNER JOIN grades g ON sa.grade_id = g.id
        WHERE sa.student_id = ? AND g.teacher_id = ?
      `, [studentId, userId]) as [any[], any];

      if (rows[0].count === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view logs for this student.',
          data: null,
          timestamp: new Date().toISOString(),
          endpoint: `/api/email-alerts/student/${studentId}`
        });
      }
    }

    const logs = await EmailLogModel.findByStudentId(studentId, Number(limit));

    // Get student details
    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/email-alerts/student/${studentId}`
      });
    }

    res.json({
      success: true,
      message: 'Student email logs retrieved successfully',
      data: {
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim(),
          email: student.parent_email
        },
        logs
      },
      timestamp: new Date().toISOString(),
      endpoint: `/api/email-alerts/student/${studentId}`
    });
  } catch (error) {
    console.error('Error fetching student email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student email logs',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/email-alerts/student/${req.params.studentId}`
    });
  }
});

// Get failed email logs for retry
router.get('/failed', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100 } = req.query;
    const userId = req.user?.id;
    const isTeacher = req.user?.role === 'teacher';

    let failedLogs;
    if (isTeacher) {
      // Filter failed logs for teacher
      const [rows] = await pool.execute(`
        SELECT el.* 
        FROM email_logs el
        JOIN marks m ON el.mark_id = m.id
        JOIN grades g ON m.grade_id = g.id
        WHERE el.status = 'failed' AND g.teacher_id = ?
        ORDER BY el.created_at DESC
        LIMIT ?
      `, [userId, Number(limit)]) as [any[], any];
      failedLogs = rows;
    } else {
      failedLogs = await EmailLogModel.findByStatus('failed', Number(limit));
    }

    // Enrich with student details
    const enrichedLogs = [];
    for (const log of failedLogs) {
      const student = await StudentModel.findById(log.student_id);
      enrichedLogs.push({
        ...log,
        student_name: student ? `${student.first_name} ${student.last_name}`.trim() : 'Unknown Student'
      });
    }

    res.json({
      success: true,
      message: 'Failed email logs retrieved successfully',
      data: enrichedLogs,
      timestamp: new Date().toISOString(),
      endpoint: '/api/email-alerts/failed'
    });
  } catch (error) {
    console.error('Error fetching failed email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve failed email logs',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/email-alerts/failed'
    });
  }
});

// Retry failed email
router.post('/retry/:logId', async (req, res) => {
  try {
    const logId = parseInt(req.params.logId);

    if (isNaN(logId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/email-alerts/retry/${logId}`
      });
    }

    const log = await EmailLogModel.findById(logId);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Email log not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/email-alerts/retry/${logId}`
      });
    }

    if (log.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Email was not failed, cannot retry',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/email-alerts/retry/${logId}`
      });
    }

    // Import EmailService dynamically to avoid circular dependency
    const EmailService = (await import('../services/EmailService')).default;
    const emailService = new EmailService();

    const result = await emailService.checkAndSendLowMarkAlert(log.mark_id);

    res.json({
      success: true,
      message: result.alertSent ? 'Email retry successful' : 'Email retry failed',
      data: {
        original_log: log,
        retry_result: result
      },
      timestamp: new Date().toISOString(),
      endpoint: `/api/email-alerts/retry/${logId}`
    });
  } catch (error) {
    console.error('Error retrying email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry email',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/email-alerts/retry/${req.params.logId}`
    });
  }
});

// Process and send email alerts for low marks in a specific grade and term
router.post('/send-low-marks', async (req: AuthRequest, res: Response) => {
  try {
    const { gradeId, term, threshold = 40 } = req.body;

    if (!gradeId || !term) {
      return res.status(400).json({
        success: false,
        message: 'Grade ID and term are required',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: '/api/email-alerts/send-low-marks'
      });
    }

    // Dynamic import to avoid circular dependency
    const EmailService = (await import('../services/EmailService')).EmailService;
    const emailService = new EmailService();

    // 1. Fetch all marks below threshold for this grade and term
    // MarksModel.findByGradeTerm doesn't filter by threshold, so we'll do it manually
    const marks = await MarksModel.findByGradeTerm(gradeId, term);

    // 2. Filter marks below threshold and not absent
    const lowMarks = marks.filter(m => {
      const percentage = typeof m.percentage === 'number' ? m.percentage : parseFloat(m.percentage || '0');
      return m.marks_obtained !== 'AB' && percentage < threshold;
    });

    if (lowMarks.length === 0) {
      return res.json({
        success: false,
        message: `No marks found below ${threshold}% for this grade and term.`,
        data: { alertsSent: 0 },
        timestamp: new Date().toISOString(),
        endpoint: '/api/email-alerts/send-low-marks'
      });
    }

    // 3. Group by student and exam type
    const studentExamPairs = new Map<string, { studentId: number, examType: string }>();
    lowMarks.forEach(m => {
      const key = `${m.student_id}:${m.exam_type}`;
      if (!studentExamPairs.has(key)) {
        studentExamPairs.set(key, { studentId: m.student_id, examType: m.exam_type });
      }
    });

    // 4. Send consolidated alerts for each student/exam combination
    let alertsSent = 0;
    for (const [, pair] of studentExamPairs) {
      try {
        await emailService.sendConsolidatedLowMarksAlert(
          pair.studentId,
          gradeId,
          term,
          pair.examType,
          true // Force send to bypass duplicate check if teacher manually triggers
        );
        alertsSent++;
      } catch (err) {
        console.error(`Failed to send alert for student ${pair.studentId}:`, err);
      }
    }

    res.json({
      success: true,
      message: `🎉 Successfully processed alerts for ${alertsSent} student(s) with low academic performance.`,
      data: { alertsSent },
      timestamp: new Date().toISOString(),
      endpoint: '/api/email-alerts/send-low-marks'
    });

  } catch (error) {
    console.error('Error sending low marks alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process low marks email alerts',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: '/api/email-alerts/send-low-marks'
    });
  }
});

export default router;
