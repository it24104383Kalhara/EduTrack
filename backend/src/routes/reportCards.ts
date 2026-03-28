import express from 'express';
import ReportCardService from '../services/ReportCardService';

const router = express.Router();
const reportCardService = new ReportCardService();

// Generate individual student report card PDF
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
        endpoint: `/api/report-cards/student/${studentId}/grade/${gradeId}/term/${term}`
      });
    }

    const pdfBuffer = await reportCardService.generateReportCardPDF(studentId, gradeId, term);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-card-${studentId}-${term}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating report card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report card',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/report-cards/student/${req.params.studentId}/grade/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

// Generate bulk report cards for entire class
router.post('/class/:gradeId/term/:term', async (req, res) => {
  try {
    const gradeId = parseInt(req.params.gradeId);
    const term = req.params.term;
    
    if (isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade ID',
        data: null,
        timestamp: new Date().toISOString(),
        endpoint: `/api/report-cards/class/${gradeId}/term/${term}`
      });
    }

    const results = await reportCardService.generateClassReportCards(gradeId, term);
    
    res.json({
      success: true,
      message: 'Class report cards generation completed',
      data: {
        summary: {
          total: results.success + results.failed,
          success: results.success,
          failed: results.failed,
          errors: results.errors
        },
        generated_cards: results.reportCards.map(card => ({
          student_id: card.student_id,
          student_name: card.student_name,
          pdf_size: card.pdf_buffer.length
        }))
      },
      timestamp: new Date().toISOString(),
      endpoint: `/api/report-cards/class/${gradeId}/term/${term}`
    });
  } catch (error) {
    console.error('Error generating class report cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate class report cards',
      data: null,
      timestamp: new Date().toISOString(),
      endpoint: `/api/report-cards/class/${req.params.gradeId}/term/${req.params.term}`
    });
  }
});

export default router;
