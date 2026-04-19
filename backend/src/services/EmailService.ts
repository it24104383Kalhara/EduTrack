import nodemailer from 'nodemailer';
import { EmailLogModel } from '../models/EmailLogSQLite';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config?: EmailConfig) {
    // For development, use ethereal.email (test email service)
    // In production, configure with real SMTP settings
    this.transporter = nodemailer.createTransport({
      host: config?.host || 'smtp.ethereal.email',
      port: config?.port || 587,
      secure: config?.secure || false,
      auth: config?.auth || {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal.pass'
      }
    });
  }

  async sendPaymentReminder(
    studentId: number,
    parentEmail: string,
    studentName: string,
    parentName: string,
    amount: number,
    dueDate: Date,
    paymentType: string
  ): Promise<boolean> {
    try {
      const subject = `Payment Reminder - ${studentName} - ${paymentType}`;
      const message = `
Dear ${parentName},

This is a friendly reminder that the payment for ${studentName} is due soon.

Student Details:
- Name: ${studentName}
- Payment Type: ${paymentType}
- Amount Due: $${amount.toFixed(2)}
- Due Date: ${dueDate.toLocaleDateString()}

Please ensure the payment is made by the due date to avoid any inconvenience.

Payment Methods:
- Bank Transfer
- Online Payment Portal
- Cash at School Office

If you have already made the payment, please disregard this email.

Best regards,
EduTrack Hostel Management
      `.trim();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@edutrack.com',
        to: parentEmail,
        subject: subject,
        text: message
      };

      await this.transporter.sendMail(mailOptions);

      // Log the email
      await EmailLogModel.create({
        student_id: studentId,
        parent_email: parentEmail,
        email_type: 'reminder',
        subject: subject,
        message: message
      });

      console.log(`Payment reminder sent to ${parentEmail} for ${studentName}`);
      return true;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return false;
    }
  }

  async sendPaymentWarning(
    studentId: number,
    parentEmail: string,
    studentName: string,
    parentName: string,
    amount: number,
    dueDate: Date,
    paymentType: string
  ): Promise<boolean> {
    try {
      const subject = `URGENT: Payment Overdue - ${studentName} - ${paymentType}`;
      const message = `
Dear ${parentName},

URGENT NOTICE: The payment for ${studentName} is now OVERDUE.

Student Details:
- Name: ${studentName}
- Payment Type: ${paymentType}
- Amount Due: $${amount.toFixed(2)}
- Due Date: ${dueDate.toLocaleDateString()} (OVERDUE)

Immediate payment is required to avoid disruption of hostel services and academic activities.

Please make the payment immediately using one of the following methods:
- Bank Transfer (Priority)
- Online Payment Portal
- Cash at School Office

Failure to pay within 48 hours may result in:
- Suspension of hostel facilities
- Withholding of academic records
- Additional late fees

If you are facing financial difficulties, please contact the school administration immediately to discuss payment arrangements.

Best regards,
EduTrack Hostel Management
      `.trim();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@edutrack.com',
        to: parentEmail,
        subject: subject,
        text: message
      };

      await this.transporter.sendMail(mailOptions);

      // Log the email
      await EmailLogModel.create({
        student_id: studentId,
        parent_email: parentEmail,
        email_type: 'warning',
        subject: subject,
        message: message
      });

      console.log(`Payment warning sent to ${parentEmail} for ${studentName}`);
      return true;
    } catch (error) {
      console.error('Error sending payment warning:', error);
      return false;
    }
  }

  async sendPaymentConfirmation(
    studentId: number,
    parentEmail: string,
    studentName: string,
    parentName: string,
    amount: number,
    paymentDate: Date,
    paymentType: string
  ): Promise<boolean> {
    try {
      const subject = `Payment Confirmation - ${studentName} - ${paymentType}`;
      const message = `
Dear ${parentName},

Thank you for your payment. We have successfully received the payment for ${studentName}.

Payment Details:
- Student Name: ${studentName}
- Payment Type: ${paymentType}
- Amount Paid: $${amount.toFixed(2)}
- Payment Date: ${paymentDate.toLocaleDateString()}
- Transaction ID: TXN${Date.now()}

Your payment has been processed and the student's account is now up to date.

If you have any questions or need a detailed receipt, please contact the school accounts office.

Best regards,
EduTrack Hostel Management
      `.trim();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@edutrack.com',
        to: parentEmail,
        subject: subject,
        text: message
      };

      await this.transporter.sendMail(mailOptions);

      // Log the email
      await EmailLogModel.create({
        student_id: studentId,
        parent_email: parentEmail,
        email_type: 'confirmation',
        subject: subject,
        message: message
      });

      console.log(`Payment confirmation sent to ${parentEmail} for ${studentName}`);
      return true;
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      return false;
    }
  }

  async sendBulkReminders(payments: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const payment of payments) {
      const result = await this.sendPaymentReminder(
        payment.student_id,
        payment.student.parent_email,
        payment.student.student_name,
        payment.student.parent_name,
        payment.amount,
        payment.due_date,
        payment.payment_type
      );

      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  async sendBulkWarnings(payments: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const payment of payments) {
      const result = await this.sendPaymentWarning(
        payment.student_id,
        payment.student.parent_email,
        payment.student.student_name,
        payment.student.parent_name,
        payment.amount,
        payment.due_date,
        payment.payment_type
      );

      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }
}
