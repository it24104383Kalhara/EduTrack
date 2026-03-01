import express from 'express';
import { SubjectModel } from '../models/Subject';

const router = express.Router();

// GET /api/subjects - Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await SubjectModel.findAll();
    res.json({
      success: true,
      data: subjects,
      message: 'Subjects retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/subjects/type/:type - Get subjects by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type !== '6-11' && type !== '12-13') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject type. Must be "6-11" or "12-13"'
      });
    }
    
    const subjects = await SubjectModel.findByType(type as '6-11' | '12-13');
    res.json({
      success: true,
      data: subjects,
      message: `${type} subjects retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching subjects by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects by type',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/subjects/:id - Get subject by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await SubjectModel.findById(id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.json({
      success: true,
      data: subject,
      message: 'Subject retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/subjects - Create new subject
router.post('/', async (req, res) => {
  try {
    const { name, code, grades, stream, type } = req.body;
    
    // Validation
    if (!name || !code || !grades || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, code, grades, type'
      });
    }
    
    if (type !== '6-11' && type !== '12-13') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject type. Must be "6-11" or "12-13"'
      });
    }
    
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Grades must be a non-empty array'
      });
    }
    
    // Check for duplicate subject code
    const existingCode = await SubjectModel.findByCode(code);
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Subject code "${code}" already exists`
      });
    }
    
    // Check for duplicate subjects in selected grades and streams
    for (const grade of grades) {
      if (stream && Array.isArray(stream)) {
        for (const streamItem of stream) {
          const existingSubject = await SubjectModel.findDuplicateInGradeStream(name, grade, streamItem);
          if (existingSubject) {
            return res.status(400).json({
              success: false,
              message: `Subject "${name}" is already added to Grade ${grade} in ${streamItem} stream`
            });
          }
        }
      } else {
        const existingSubject = await SubjectModel.findDuplicateInGradeStream(name, grade, stream);
        if (existingSubject) {
          return res.status(400).json({
            success: false,
            message: `Subject "${name}" is already added to Grade ${grade}`
          });
        }
      }
    }
    
    // Create subject
    const newSubject = await SubjectModel.create({
      name: name.trim(),
      code: code.trim(),
      grades,
      stream,
      type
    });
    
    res.status(201).json({
      success: true,
      data: newSubject,
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subject',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/subjects/:id - Update subject
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, grades, stream, type } = req.body;
    
    // Check if subject exists
    const existingSubject = await SubjectModel.findById(id);
    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Validate type if provided
    if (type && type !== '6-11' && type !== '12-13') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject type. Must be "6-11" or "12-13"'
      });
    }
    
    // Validate grades if provided
    if (grades && (!Array.isArray(grades) || grades.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Grades must be a non-empty array'
      });
    }
    
    // Check for duplicate subject code if code is being updated
    if (code && code !== existingSubject.code) {
      const existingCode = await SubjectModel.findByCode(code, id);
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: `Subject code "${code}" already exists`
        });
      }
    }
    
    // Check for duplicate subjects in selected grades and streams if name or grades are being updated
    if (name || grades) {
      const checkName = name || existingSubject.name;
      const checkGrades = grades || existingSubject.grade_array;
      const checkStream = stream !== undefined ? stream : existingSubject.stream_array;
      
      for (const grade of checkGrades) {
        if (checkStream && Array.isArray(checkStream)) {
          for (const streamItem of checkStream) {
            const existingDuplicate = await SubjectModel.findDuplicateInGradeStream(checkName, grade, streamItem, id);
            if (existingDuplicate) {
              return res.status(400).json({
                success: false,
                message: `Subject "${checkName}" is already added to Grade ${grade} in ${streamItem} stream`
              });
            }
          }
        } else {
          const existingDuplicate = await SubjectModel.findDuplicateInGradeStream(checkName, grade, checkStream, id);
          if (existingDuplicate) {
            return res.status(400).json({
              success: false,
              message: `Subject "${checkName}" is already added to Grade ${grade}`
            });
          }
        }
      }
    }
    
    // Prepare updates
    const updates: Partial<Omit<any, 'id' | 'created_at' | 'updated_at'>> = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim();
    if (grades !== undefined) updates.grades = grades;
    if (stream !== undefined) updates.stream = stream;
    if (type !== undefined) updates.type = type;
    
    // Update subject
    const updatedSubject = await SubjectModel.update(id, updates);
    
    if (!updatedSubject) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update subject'
      });
    }
    
    res.json({
      success: true,
      data: updatedSubject,
      message: 'Subject updated successfully'
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subject',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/subjects/:id - Delete subject
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subject exists
    const existingSubject = await SubjectModel.findById(id);
    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Delete subject
    const deleted = await SubjectModel.delete(id);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete subject'
      });
    }
    
    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subject',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
