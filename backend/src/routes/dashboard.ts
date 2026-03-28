import express from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/dashboard/recent-activity
 * Fetches the most recent updates across all major tables
 */
router.get('/recent-activity', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const teacherFilter = (table: string) => {
      if (userRole === 'admin') return '';
      if (table === 'students') return ` AND id IN (SELECT student_id FROM student_assignment sa JOIN grades g ON sa.grade_id = g.id WHERE g.teacher_id = ${userId})`;
      if (table === 'grades') return ` AND id IN (SELECT id FROM grades WHERE teacher_id = ${userId})`;
      if (table === 'subjects') return ` AND EXISTS (SELECT 1 FROM grades g WHERE g.teacher_id = ${userId} AND JSON_CONTAINS(subjects.grades, CAST(g.grade AS CHAR), '$'))`;
      if (table === 'attendance') return ` AND grade_id IN (SELECT id FROM grades WHERE teacher_id = ${userId})`;
      if (table === 'marks') return ` AND grade_id IN (SELECT id FROM grades WHERE teacher_id = ${userId})`;
      return '';
    };

    const queries = [
      {
        table: 'students',
        type: 'Student',
        query: `SELECT COUNT(*) as count, MAX(updated_at) as latest FROM students WHERE DATE(updated_at) = CURDATE()${teacherFilter('students')}`,
        format: (row: any) => row.count > 0 ? `Registered/Updated ${row.count} student${row.count > 1 ? 's' : ''}` : null
      },
      {
        table: 'grades',
        type: 'Grade',
        query: `SELECT COUNT(*) as count, MAX(updated_at) as latest FROM grades WHERE DATE(updated_at) = CURDATE()${teacherFilter('grades')}`,
        format: (row: any) => row.count > 0 ? `Updated ${row.count} grade${row.count > 1 ? 's' : ''}` : null
      },
      {
        table: 'subjects',
        type: 'Subject',
        query: `SELECT COUNT(*) as count, MAX(updated_at) as latest FROM subjects WHERE DATE(updated_at) = CURDATE()${teacherFilter('subjects')}`,
        format: (row: any) => row.count > 0 ? `Added/Updated ${row.count} subject${row.count > 1 ? 's' : ''}` : null
      },
      {
        table: 'attendance',
        type: 'Attendance',
        query: `SELECT COUNT(*) as count, MAX(updated_at) as latest FROM attendance_mark WHERE DATE(updated_at) = CURDATE()${teacherFilter('attendance')}`,
        format: (row: any) => row.count > 0 ? `Marked attendance for ${row.count} student${row.count > 1 ? 's' : ''}` : null
      },
      {
        table: 'marks',
        type: 'Mark',
        query: `SELECT COUNT(*) as count, COUNT(DISTINCT subject_id) as subCount, MAX(updated_at) as latest FROM marks WHERE DATE(updated_at) = CURDATE()${teacherFilter('marks')}`,
        format: (row: any) => row.count > 0 ? `Added ${row.count} mark${row.count > 1 ? 's' : ''} across ${row.subCount} subject${row.subCount > 1 ? 's' : ''}` : null
      }
    ];

    const allActivities: any[] = [];

    for (const q of queries) {
      try {
        const [results] = await pool.query(q.query) as any[];
        if (results && results.length > 0 && results[0].count > 0) {
          const row = results[0];
          const description = q.format(row);
          if (description) {
            allActivities.push({
              type: q.type,
              description: description,
              timestamp: row.latest || new Date(),
              time: new Date(row.latest || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              date: new Date(row.latest || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
          }
        }
      } catch (err) {
        console.error(`Error executing query for ${q.table}:`, err);
      }
    }

    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      message: 'Recent activity fetched successfully',
      data: sortedActivities,
      timestamp: new Date().toISOString(),
      endpoint: '/api/dashboard/recent-activity'
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch recent activity',
      data: [],
      timestamp: new Date().toISOString(),
      endpoint: '/api/dashboard/recent-activity'
    });
  }
});

/**
 * GET /api/dashboard/stats
 */
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let studentQuery = 'SELECT COUNT(*) as totalStudents FROM students';
    let gradeQuery = 'SELECT COUNT(*) as totalGrades FROM grades';
    let attQuery = 'SELECT COUNT(*) as presentToday FROM attendance_mark WHERE status = "present" AND DATE(marked_date) = CURDATE()';

    if (userRole === 'teacher') {
      studentQuery = `SELECT COUNT(*) as totalStudents FROM students WHERE id IN (SELECT student_id FROM student_assignment sa JOIN grades g ON sa.grade_id = g.id WHERE g.teacher_id = ${userId})`;
      gradeQuery = `SELECT COUNT(*) as totalGrades FROM grades WHERE teacher_id = ${userId}`;
      attQuery = `SELECT COUNT(*) as presentToday FROM attendance_mark WHERE status = "present" AND DATE(marked_date) = CURDATE() AND grade_id IN (SELECT id FROM grades WHERE teacher_id = ${userId})`;
    }

    const [[studentStats]] = await pool.query(studentQuery) as any[];
    const [[gradeStats]] = await pool.query(gradeQuery) as any[];
    
    let subjectQuery = 'SELECT COUNT(*) as totalSubjects FROM subjects';
    if (userRole === 'teacher') {
      // Find subjects where the subject's grades overlap with teacher's assigned grades
      // For simplicity in SQL without complex JSON functions, we can fetch all and filter or use a more complex query
      // Using JSON_OVERLAPS if available, or a fallback. 
      // Let's use a subquery to get all teacher's grade levels.
      subjectQuery = `
        SELECT COUNT(DISTINCT s.id) as totalSubjects 
        FROM subjects s
        WHERE EXISTS (
          SELECT 1 FROM grades g 
          WHERE g.teacher_id = ${userId} 
          AND JSON_CONTAINS(s.grades, CAST(g.grade AS CHAR), '$')
        )
      `;
    }
    const [[subjectStats]] = await pool.query(subjectQuery) as any[];
    
    // Check if attendance_mark exists, if not use a safe fallback
    let presentToday = 0;
    try {
      const [[attStats]] = await pool.query(attQuery) as any[];
      presentToday = attStats.presentToday || 0;
    } catch (e) {
      console.warn('attendance_mark table might not be ready:', e);
    }

    res.json({
      success: true,
      data: {
        totalStudents: studentStats.totalStudents || 0,
        totalGrades: gradeStats.totalGrades || 0,
        totalSubjects: subjectStats.totalSubjects || 0,
        presentToday: presentToday
      },
      timestamp: new Date().toISOString(),
      endpoint: '/api/dashboard/stats'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

export default router;
