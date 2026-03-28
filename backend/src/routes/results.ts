import express from 'express';
import ResultService from '../services/ResultService';

const router = express.Router();
const resultService = new ResultService();

// Generate comprehensive class results
router.get('/class/:gradeId/term/:term', async (req, res) => {
  try {
    const gradeId = parseInt(req.params.gradeId);
    const term = req.params.term;
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/results/class/${gradeId}/term/${term}`
      });
    }

    const classResults = await resultService.generateClassResults(gradeId, term);
    
    res.json({
      success: true,
      message: 'Class results generated successfully',
      data: classResults,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/class/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error generating class results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate class results',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/class/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Generate individual student result card
router.get('/student/:studentId/grade/:gradeId/term/:term', async (req, res) => {
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
        endpoint: `/api/results/student/${studentId}/grade/${gradeId}/term/${term}`
      });
    }

    const studentResult = await resultService.generateStudentResultCard(studentId, gradeId, term);
    
    if (!studentResult) {
      return res.status(404).json({
        success: false,
        message: 'Student result not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/results/student/${studentId}/grade/${gradeId}/term/${term}`
      });
    }

    res.json({
      success: true,
      message: 'Student result generated successfully',
      data: studentResult,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/student/${studentId}/grade/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error generating student result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate student result',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/student/${req.params.studentId}/grade/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Generate individual student result card with rank
router.get('/student/:studentId/grade/:gradeId/term/:term/ranked', async (req, res) => {
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
        endpoint: `/api/results/student/${studentId}/grade/${gradeId}/term/${term}/ranked`
      });
    }

    const rankedResult = await resultService.generateStudentResultWithRank(studentId, gradeId, term);
    
    if (!rankedResult) {
      return res.status(404).json({
        success: false,
        message: 'Student result not found',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/results/student/${studentId}/grade/${gradeId}/term/${term}/ranked`
      });
    }

    res.json({
      success: true,
      message: 'Student ranked result generated successfully',
      data: rankedResult,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/student/${studentId}/grade/${gradeId}/term/${term}/ranked`
    });
  } catch (error) {
    console.error('Error generating ranked student result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ranked student result',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/student/${req.params.studentId}/grade/${req.params.gradeId}/term/${req.params.term}/ranked`
    });
  }
});

// Generate merit list
router.get('/merit/:gradeId/term/:term', async (req, res) => {
  try {
    const gradeId = parseInt(req.params.gradeId);
    const term = req.params.term;
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/results/merit/${gradeId}/term/${term}`
      });
    }

    const meritList = await resultService.generateMeritList(gradeId, term);
    
    res.json({
      success: true,
      message: 'Merit list generated successfully',
      data: meritList,
      count: meritList.length,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/merit/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error generating merit list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate merit list',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/merit/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Calculate performance trends
router.post('/trends/:gradeId', async (req, res) => {
  try {
    const gradeId = parseInt(req.params.gradeId);
    const { terms } = req.body;
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/results/trends/${gradeId}`
      });
    }

    if (!Array.isArray(terms) || terms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Terms must be a non-empty array',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/results/trends/${gradeId}`
      });
    }

    const trends = await resultService.calculatePerformanceTrends(gradeId, terms);
    
    res.json({
      success: true,
      message: 'Performance trends calculated successfully',
      data: trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/trends/${gradeId}`
    });
  } catch (error) {
    console.error('Error calculating performance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate performance trends',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/results/trends/${req.params.gradeId}`
    });
  }
});

export default router;
