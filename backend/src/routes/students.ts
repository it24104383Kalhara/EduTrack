import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  assignStudentToRoom,
  removeStudentFromRoom,
  getUnassignedStudents,
  getStudentsInRoom
} from '../controllers/studentController';

const router = Router();

// GET /api/students - Get all students
router.get('/', getAllStudents);

// GET /api/students/unassigned - Get unassigned students
router.get('/unassigned', getUnassignedStudents);

// GET /api/students/room/:roomId - Get students in specific room
router.get('/room/:roomId', getStudentsInRoom);

// GET /api/students/:id - Get student by ID
router.get('/:id', getStudentById);

// POST /api/students - Create new student
router.post('/', createStudent);

// PUT /api/students/:id - Update student
router.put('/:id', updateStudent);

// DELETE /api/students/:id - Delete student
router.delete('/:id', deleteStudent);

// POST /api/students/assign - Assign student to room
router.post('/assign', assignStudentToRoom);

// DELETE /api/students/:id/room - Remove student from room
router.delete('/:id/room', removeStudentFromRoom);

export default router;
