import express from 'express';
import { Mark, MarkModel } from '../models/Mark';

const router = express.Router();

// GET /api/marks - Get all marks
router.get('/', async (req, res) => {
  try {
    const marks = await MarkModel.findAll();
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marks', error });
  }
});

// GET /api/marks/:id - Get mark by ID
router.get('/:id', async (req, res) => {
  try {
    const mark = await MarkModel.findById(parseInt(req.params.id));
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }
    res.json(mark);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mark', error });
  }
});

// GET /api/marks/student/:studentId - Get marks by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const studentMarks = await MarkModel.findByStudentId(parseInt(req.params.studentId));
    res.json(studentMarks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student marks', error });
  }
});

// GET /api/marks/subject/:subjectId - Get marks by subject ID
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const subjectMarks = await MarkModel.findBySubjectId(req.params.subjectId);
    res.json(subjectMarks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subject marks', error });
  }
});

// GET /api/marks/grade/:grade/section/:section - Get marks by grade and section
router.get('/grade/:grade/section/:section', async (req, res) => {
  try {
    const gradeSectionMarks = await MarkModel.findByGradeAndSection(
      req.params.grade,
      req.params.section
    );
    res.json(gradeSectionMarks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grade section marks', error });
  }
});

// POST /api/marks - Create new mark
router.post('/', async (req, res) => {
  try {
    const { studentId, subjectId, marks: markValue, maxMarks, examType, date } = req.body;

    if (!studentId || !subjectId || !markValue || !examType) {
      return res.status(400).json({ 
        message: 'Missing required fields: studentId, subjectId, marks, examType' 
      });
    }

    const newMark = await MarkModel.create({
      studentId,
      subjectId,
      marks: parseFloat(markValue),
      maxMarks: parseFloat(maxMarks) || 100,
      examType,
      date: date || new Date().toISOString().split('T')[0]
    });

    res.status(201).json(newMark);
  } catch (error) {
    res.status(500).json({ message: 'Error creating mark', error });
  }
});

// PUT /api/marks/:id - Update mark
router.put('/:id', async (req, res) => {
  try {
    const { marks: markValue, maxMarks, examType, date } = req.body;
    
    const updates: any = {};
    if (markValue !== undefined) updates.marks = parseFloat(markValue);
    if (maxMarks !== undefined) updates.maxMarks = parseFloat(maxMarks);
    if (examType !== undefined) updates.examType = examType;
    if (date !== undefined) updates.date = date;

    const updatedMark = await MarkModel.update(parseInt(req.params.id), updates);
    if (!updatedMark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    res.json(updatedMark);
  } catch (error) {
    res.status(500).json({ message: 'Error updating mark', error });
  }
});

// DELETE /api/marks/:id - Delete mark
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MarkModel.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Mark not found' });
    }
    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mark', error });
  }
});

// DELETE /api/marks - Clear all marks
router.delete('/', async (req, res) => {
  try {
    await MarkModel.deleteAll();
    res.json({ message: 'All marks cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing marks', error });
  }
});

export default router;
