import express from 'express';
import { AttendanceModel } from '../models/Attendance';
import { StudentModel } from '../models/Student';
import { GradeModel } from '../models/Grade';

const router = express.Router();

// Get attendance for a specific date and grade
router.get('/grade/:gradeId/date/:date', async (req, res) => {
  try {
    const { gradeId, date } = req.params;
    
    const attendance = await AttendanceModel.getByDateAndGrade(date, parseInt(gradeId));
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance'
    });
  }
});

// Get attendance statistics for a grade on a specific date
router.get('/stats/grade/:gradeId/date/:date', async (req, res) => {
  try {
    const { gradeId, date } = req.params;
    
    const stats = await AttendanceModel.getGradeStats(date, parseInt(gradeId));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    });
  }
});

// Get all grades with their students and attendance for a specific date
router.get('/grades-with-students/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Get all grades
    const grades = await GradeModel.findAll();
    
    // Get students for each grade and their attendance
    const gradesWithStudents = await Promise.all(
      grades.map(async (grade) => {
        // Get students in this grade
        const students = await StudentModel.findAll(); // Get all students and filter by grade
        
        // Get attendance for these students on the specified date
        const attendanceRecords = await AttendanceModel.getByDateAndGrade(date, grade.id!);
        
        // Create attendance map for quick lookup
        const attendanceMap = new Map(
          attendanceRecords.map(record => [record.student_id, record.status])
        );
        
        // Filter students by grade and combine with attendance
        const studentsWithAttendance = students
          .filter((student: any) => student.grade_id === grade.id)
          .map((student: any) => ({
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            grade_id: grade.id,
            grade_name: grade.grade,
            attendance_status: attendanceMap.get(student.id) || null // null if not marked yet
          }));
        
        return {
          grade_id: grade.id,
          grade_name: grade.grade,
          students: studentsWithAttendance,
          date: date,
          total_students: studentsWithAttendance.length
        };
      })
    );
    
    // Log statistics for debugging
    const gradesWithStudentsCount = gradesWithStudents.filter(g => g.students.length > 0).length;
    const emptyGradesCount = gradesWithStudents.filter(g => g.students.length === 0).length;
    
    console.log(`Attendance data for ${date}:`);
    console.log(`- Total grades: ${gradesWithStudents.length}`);
    console.log(`- Grades with students: ${gradesWithStudentsCount}`);
    console.log(`- Empty grades: ${emptyGradesCount}`);
    console.log(`- Grades with students: ${gradesWithStudents.filter(g => g.students.length > 0).map((g: any) => `${g.grade_name}(${g.students.length})`).join(', ')}`);
    
    res.json({
      success: true,
      data: gradesWithStudents,
      statistics: {
        total_grades: gradesWithStudents.length,
        grades_with_students: gradesWithStudentsCount,
        empty_grades: emptyGradesCount
      }
    });
  } catch (error) {
    console.error('Error fetching grades with students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades with students'
    });
  }
});

// Mark attendance for multiple students
router.post('/mark', async (req, res) => {
  try {
    const { date, gradeId, attendance } = req.body;
    
    if (!date || !gradeId || !attendance) {
      return res.status(400).json({
        success: false,
        message: 'Date, grade ID, and attendance data are required'
      });
    }
    
    // Prepare attendance records
    const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: parseInt(studentId),
      grade_id: parseInt(gradeId),
      date: date,
      status: status as number // 1 for present, 0 for absent
    }));
    
    // Bulk create/update attendance
    await AttendanceModel.bulkCreateOrUpdate(attendanceRecords);
    
    res.json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
});

// Mark attendance for a single student
router.post('/mark-single', async (req, res) => {
  try {
    const { studentId, gradeId, date, status } = req.body;
    
    if (!studentId || !gradeId || !date || status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, grade ID, date, and status are required'
      });
    }
    
    const attendance = await AttendanceModel.createOrUpdate({
      student_id: parseInt(studentId),
      grade_id: parseInt(gradeId),
      date: date,
      status: parseInt(status)
    });
    
    res.json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Error marking single attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
});

// Get attendance for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const attendance = await AttendanceModel.getByStudent(parseInt(studentId));
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance'
    });
  }
});

// Get monthly attendance statistics for a grade
router.get('/monthly-stats/grade/:gradeId/:year/:month', async (req, res) => {
  try {
    const { gradeId, year, month } = req.params;
    
    const stats = await AttendanceModel.getMonthlyStats(
      parseInt(gradeId),
      parseInt(year),
      parseInt(month)
    );
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly attendance statistics'
    });
  }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await AttendanceModel.delete(parseInt(id));
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record'
    });
  }
});

export default router;
