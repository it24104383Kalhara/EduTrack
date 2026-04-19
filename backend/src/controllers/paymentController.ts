import { Request, Response } from 'express';
import { PaymentModel } from '../models/PaymentSQLite';
import { StudentModel } from '../models/StudentSQLite';
import { EmailService } from '../services/EmailService';

const emailService = new EmailService();

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.getAll();
    res.json({
      success: true,
      data: payments,
      message: 'Payments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

export const getPaymentsByStudentId = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const studentIdParam = Array.isArray(studentId) ? studentId[0] : studentId;
    
    const payments = await PaymentModel.getByStudentId(parseInt(studentIdParam));
    
    res.json({
      success: true,
      data: payments,
      message: 'Student payments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student payments'
    });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { student_id, amount, due_date, payment_type } = req.body;
    
    if (!student_id || !amount || !due_date || !payment_type) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    // Check if student exists
    const student = await StudentModel.getById(parseInt(student_id));
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const payment = await PaymentModel.create({
      student_id: parseInt(student_id),
      amount: parseFloat(amount),
      due_date: new Date(due_date).toISOString().split('T')[0],
      status: 'pending',
      payment_type
    });
    
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment'
    });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, payment_date } = req.body;
    const paymentId = Array.isArray(id) ? id[0] : id;
    
    if (!status || !['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }
    
    // Check if payment exists
    const existingPayment = await PaymentModel.getById(parseInt(paymentId));
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const payment = await PaymentModel.updateStatus(
      parseInt(paymentId),
      status,
      payment_date ? new Date(payment_date) : undefined
    );
    
    // If payment is marked as paid, send confirmation email
    if (status === 'paid' && payment) {
      const student = await StudentModel.getById(existingPayment.student_id);
      if (student && student.parent_email) {
        await emailService.sendPaymentConfirmation(
          existingPayment.student_id,
          student.parent_email,
          student.student_name,
          student.parent_name,
          existingPayment.amount,
          new Date(),
          existingPayment.payment_type
        );
      }
    }
    
    res.json({
      success: true,
      data: payment,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
};

export const getPendingPayments = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.getPendingPayments();
    res.json({
      success: true,
      data: payments,
      message: 'Pending payments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments'
    });
  }
};

export const getPaymentsDueInWeek = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.getPaymentsDueInWeek();
    res.json({
      success: true,
      data: payments,
      message: 'Payments due in week retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching payments due in week:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments due in week'
    });
  }
};

export const getOverduePayments = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.getOverduePayments();
    res.json({
      success: true,
      data: payments,
      message: 'Overdue payments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue payments'
    });
  }
};

export const sendPaymentReminders = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.getPaymentsDueInWeek();
    
    if (payments.length === 0) {
      return res.json({
        success: true,
        message: 'No payments due in the next week',
        data: { sent: 0, failed: 0 }
      });
    }
    
    const result = await emailService.sendBulkReminders(payments);
    
    // Mark emails as sent
    for (const payment of payments) {
      await PaymentModel.markEmailSent(payment.id);
    }
    
    res.json({
      success: true,
      message: `Payment reminders sent: ${result.success} successful, ${result.failed} failed`,
      data: result
    });
  } catch (error) {
    console.error('Error sending payment reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment reminders'
    });
  }
};

export const sendPaymentWarnings = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.getOverduePayments();
    
    if (payments.length === 0) {
      return res.json({
        success: true,
        message: 'No overdue payments',
        data: { sent: 0, failed: 0 }
      });
    }
    
    const result = await emailService.sendBulkWarnings(payments);
    
    // Mark warnings as sent and update status to overdue
    for (const payment of payments) {
      await PaymentModel.markWarningSent(payment.id);
      await PaymentModel.updateStatus(payment.id, 'overdue');
    }
    
    res.json({
      success: true,
      message: `Payment warnings sent: ${result.success} successful, ${result.failed} failed`,
      data: result
    });
  } catch (error) {
    console.error('Error sending payment warnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment warnings'
    });
  }
};

export const createMonthlyPayments = async (req: Request, res: Response) => {
  try {
    await PaymentModel.createMonthlyPaymentsForAllStudents();
    
    res.json({
      success: true,
      message: 'Monthly payments created for all hostel students'
    });
  } catch (error) {
    console.error('Error creating monthly payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create monthly payments'
    });
  }
};
