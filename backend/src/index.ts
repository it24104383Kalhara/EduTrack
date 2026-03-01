import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gradeRoutes from './routes/grades';
import studentRoutes from './routes/students';
import subjectRoutes from './routes/subjects';
import attendanceRoutes from './routes/attendance';
import attendanceMarkRoutes from './routes/attendanceMark';
import { testConnection } from './config/database';
import { StudentModel } from './models/Student';
import { GradeModel } from './models/Grade';
import { SubjectModel } from './models/Subject';
import { AttendanceModel } from './models/Attendance';
import { AttendanceMarkModel } from './models/AttendanceMark';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/grades', gradeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendance-mark', attendanceMarkRoutes);

// Initialize database and start server
const initializeDatabase = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Create tables
    await StudentModel.createTable();
    await GradeModel.createTable();
    await SubjectModel.createTable();
    await AttendanceModel.createTable();
    await AttendanceMarkModel.createTable();
    
    console.log('✅ Database initialized successfully');
    console.log('📊 Tables: students, grades, student_assignment, subjects, attendance, attendance_mark');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log('📚 API Documentation:');
    console.log('  - GET  /api/grades - Get all grades');
    console.log('  - POST /api/grades/create - Create new grade');
    console.log('  - GET  /api/grades/:id - Get grade by ID');
    console.log('  - PUT  /api/grades/:id - Update grade');
    console.log('  - DELETE /api/grades/:id - Delete grade');
    console.log('  - POST /api/grades/:gradeId/assign-student/:studentId - Assign student to grade');
    console.log('  - DELETE /api/grades/:gradeId/remove-student/:studentId - Remove student from grade');
    console.log('  - GET  /api/students - Get all students');
    console.log('  - POST /api/students/register - Register new student');
    console.log('  - GET  /api/students/:id - Get student by ID');
    console.log('  - PUT  /api/students/:id - Update student');
    console.log('  - DELETE /api/students/:id - Delete student');
    console.log('  - GET  /api/subjects - Get all subjects');
    console.log('  - POST /api/subjects - Create new subject');
    console.log('  - GET  /api/subjects/:id - Get subject by ID');
    console.log('  - PUT  /api/subjects/:id - Update subject');
    console.log('  - DELETE /api/subjects/:id - Delete subject');
    console.log('  - GET  /api/subjects/type/:type - Get subjects by type');
    console.log('  - POST /api/attendance/mark - Mark attendance for students');
    console.log('  - GET  /api/attendance/grade/:grade_id/date/:date - Get attendance by grade and date');
    console.log('  - GET  /api/attendance/grade/:grade_id/dates - Get attendance dates for grade');
    console.log('  - GET  /api/attendance/student/:student_id/report - Get student attendance report');
    console.log('  - GET  /api/attendance/grade/:grade_id/report - Get grade attendance report');
    console.log('  - DELETE /api/attendance/grade/:grade_id/date/:date - Delete attendance records');
    console.log('  - GET  /api/attendance/statistics - Get attendance statistics');
    console.log('  - POST /api/attendance-mark/mark - Mark attendance for student');
    console.log('  - POST /api/attendance-mark/bulk-mark - Mark attendance for multiple students');
    console.log('  - GET  /api/attendance-mark/grade/:grade/section/:section/date/:date - Get attendance by grade, section, and date');
    console.log('  - GET  /api/attendance-mark/student/:student_id - Get student attendance records');
    console.log('  - GET  /api/attendance-mark/all - Get all attendance records');
    console.log('  - PUT  /api/attendance-mark/update/:student_id/:date - Update attendance status');
    console.log('  - DELETE /api/attendance-mark/:student_id/:date - Delete attendance record');
    console.log('  - GET  /api/attendance-mark/statistics - Get attendance statistics');
    console.log('  - GET  /health - Health check');
  });
};

startServer().catch(console.error);
