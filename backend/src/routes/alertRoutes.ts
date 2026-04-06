import express from 'express';
import * as alertController from '../controllers/alertController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Initialize alerts table (run once during setup)
router.post('/initialize', authenticate, authorize(['Admin']), alertController.initializeAlerts);

// Alert CRUD
router.post('/', authenticate, authorize(['Admin', 'Coach', 'Teacher']), alertController.createAlert);
router.get('/', authenticate, alertController.getAlerts);
router.get('/stats', authenticate, authorize(['Admin', 'Coach']), alertController.getAlertStats);
router.get('/:id', authenticate, alertController.getAlert);
router.put('/:id/status', authenticate, authorize(['Admin', 'Coach']), alertController.updateAlertStatus);
router.delete('/:id', authenticate, authorize(['Admin']), alertController.deleteAlert);

// Automatic Detection
router.post('/check-missing/:sessionId', authenticate, authorize(['Admin', 'Coach']), alertController.checkMissingStudents);

export default router;
