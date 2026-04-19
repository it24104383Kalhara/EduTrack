import { Router } from 'express';
import {
  getAllPayments,
  getPaymentsByStudentId,
  createPayment,
  updatePaymentStatus,
  getPendingPayments,
  getPaymentsDueInWeek,
  getOverduePayments,
  sendPaymentReminders,
  sendPaymentWarnings,
  createMonthlyPayments
} from '../controllers/paymentController';

const router = Router();

// GET /api/payments - Get all payments
router.get('/', getAllPayments);

// GET /api/payments/pending - Get pending payments
router.get('/pending', getPendingPayments);

// GET /api/payments/due-in-week - Get payments due in next week
router.get('/due-in-week', getPaymentsDueInWeek);

// GET /api/payments/overdue - Get overdue payments
router.get('/overdue', getOverduePayments);

// GET /api/payments/student/:studentId - Get payments by student ID
router.get('/student/:studentId', getPaymentsByStudentId);

// POST /api/payments - Create new payment
router.post('/', createPayment);

// PUT /api/payments/:id - Update payment status
router.put('/:id', updatePaymentStatus);

// POST /api/payments/send-reminders - Send payment reminder emails
router.post('/send-reminders', sendPaymentReminders);

// POST /api/payments/send-warnings - Send payment warning emails
router.post('/send-warnings', sendPaymentWarnings);

// POST /api/payments/create-monthly - Create monthly payments for all students
router.post('/create-monthly', createMonthlyPayments);

export default router;
