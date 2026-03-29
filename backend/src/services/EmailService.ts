import nodemailer from 'nodemailer';
import pool from '../config/database';
import { MarksModel, MarkWithDetails } from '../models/Marks';
import { EmailLogModel, EmailLog } from '../models/EmailLog';

export interface EmailAlert {
  id: number;
  student_id: number;
  student_name: string;
  subject_name: string;
  subject_code: string;
  grade_name: string;
  marks_obtained: string | number;
  max_marks: number;
  percentage: number | string;
  grade_obtained: string;
  parent_email: string;
  parent_name: string;
  registration_number?: string;
  exam_type: string;
  exam_date: string;
  created_at: string;
}

export class EmailService {
  private static transporterInstance: nodemailer.Transporter | null = null;
  private transporter: nodemailer.Transporter;

  constructor() {
    if (!EmailService.transporterInstance) {
      // Configure email transporter as a shared pool
      EmailService.transporterInstance = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        pool: true, // Enable connection pooling
        maxConnections: 5,
        maxMessages: 100,
        auth: {
          user: process.env.SMTP_USER || 'your-email@gmail.com',
          pass: process.env.SMTP_PASS || 'your-app-password'
        }
      });
    }
    this.transporter = EmailService.transporterInstance;
  }

  /**
   * Send low marks alert to parent
   */
  async sendLowMarksAlert(alertData: EmailAlert): Promise<{
    success: boolean;
    emailLog?: EmailLog;
    error?: string;
  }> {
    try {
      // Deduplication check removed per user request. individual alerts sent on every trigger.

      const subject = `📚 Urgent: Low Marks Alert - ${alertData.student_name} - ${alertData.subject_name}`;
      
      const htmlContent = this.generateLowMarksEmailHTML(alertData);
      
      const mailOptions = {
        from: `"EduTrack System" <${process.env.SMTP_USER || 'noreply@edutrack.com'}>`,
        to: alertData.parent_email,
        subject: subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Low marks alert sent successfully:', info.messageId);
      
      // Log successful email
      const emailLog = await EmailLogModel.create({
        mark_id: alertData.id,
        student_id: alertData.student_id,
        parent_email: alertData.parent_email,
        email_type: 'low_mark_alert',
        status: 'sent',
        sent_at: new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ')
      });
      
      return {
        success: true,
        emailLog
      };
    } catch (error) {
      console.error('❌ Error sending low marks alert:', error);
      
      // Log failed email
      const emailLog = await EmailLogModel.create({
        mark_id: alertData.id,
        student_id: alertData.student_id,
        parent_email: alertData.parent_email,
        email_type: 'low_mark_alert',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        emailLog,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk low marks alerts
   */
  async sendBulkLowMarksAlerts(alerts: EmailAlert[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
    emailLogs: EmailLog[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
      emailLogs: [] as EmailLog[]
    };

    for (const alert of alerts) {
      try {
        const result = await this.sendLowMarksAlert(alert);
        results.emailLogs.push(result.emailLog!);
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            email: alert.parent_email,
            error: result.error || 'Failed to send email'
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: alert.parent_email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Check and send low marks alert for a single mark
   */
  async checkAndSendLowMarkAlert(markId: number, force: boolean = false): Promise<{
    alertSent: boolean;
    emailLog?: EmailLog;
    error?: string;
  }> {
    try {
      // Get the mark with details
      const mark = await MarksModel.findById(markId);
      if (!mark) {
        return {
          alertSent: false,
          error: 'Mark not found'
        };
      }

      // Skip alert for absent students
      if (mark.marks_obtained === 'AB') {
        return {
          alertSent: false,
          error: 'Student is absent, no alert needed'
        };
      }

      // Check if percentage is below threshold
      const percentage = typeof mark.percentage === 'number' ? mark.percentage : parseFloat(mark.percentage || '0');
      if (percentage >= 40) {
        return {
          alertSent: false,
          error: 'Mark is above low mark threshold'
        };
      }

      // Database-level deduplication check removed per user request.

      // Get mark with student details for email
      const marksWithDetails = await MarksModel.findByStudentGradeTerm(
        mark.student_id, 
        mark.grade_id, 
        mark.term
      );
      
      const markWithDetails = marksWithDetails.find(m => m.id === markId);
      if (!markWithDetails || !markWithDetails.parent_email) {
        return {
          alertSent: false,
          error: 'Student email not found'
        };
      }

      // Convert to alert format
      const alertData: EmailAlert = {
        id: markWithDetails.id!,
        student_id: markWithDetails.student_id,
        student_name: markWithDetails.student_name,
        subject_name: markWithDetails.subject_name,
        subject_code: markWithDetails.subject_code,
        grade_name: markWithDetails.grade_name,
        marks_obtained: markWithDetails.marks_obtained,
        max_marks: markWithDetails.max_marks,
        percentage: markWithDetails.percentage ?? 0,
        grade_obtained: markWithDetails.grade_obtained,
        parent_email: markWithDetails.parent_email!,
        parent_name: markWithDetails.parent_name || 'Parent/Guardian',
        registration_number: markWithDetails.student_id?.toString() || '',
        exam_type: markWithDetails.exam_type,
        exam_date: markWithDetails.exam_date,
        created_at: markWithDetails.created_at || new Date().toISOString()
      };

      const result = await this.sendLowMarksAlert(alertData);
      
      return {
        alertSent: result.success,
        emailLog: result.emailLog,
        error: result.error
      };
    } catch (error) {
      console.error('❌ Error in checkAndSendLowMarkAlert:', error);
      return {
        alertSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check for low marks and send alerts
   */
  async checkAndSendLowMarksAlerts(threshold: number = 40): Promise<{
    alertsFound: number;
    alertsSent: number;
    alertsFailed: number;
    details: EmailAlert[];
    emailLogs: EmailLog[];
  }> {
    try {
      // Get all marks below threshold
      const lowMarks = await MarksModel.getLowMarks(threshold);
      
      if (lowMarks.length === 0) {
        console.log('ℹ️ No low marks found for alert threshold:', threshold);
        return {
          alertsFound: 0,
          alertsSent: 0,
          alertsFailed: 0,
          details: [],
          emailLogs: []
        };
      }

      // Convert to alert format
      const alerts: EmailAlert[] = lowMarks.map(mark => ({
        id: mark.id!,
        student_id: mark.student_id,
        student_name: mark.student_name,
        subject_name: mark.subject_name,
        subject_code: mark.subject_code,
        grade_name: mark.grade_name,
        marks_obtained: mark.marks_obtained,
        max_marks: mark.max_marks,
        percentage: mark.percentage ?? 0,
        grade_obtained: mark.grade_obtained,
        parent_email: mark.parent_email || '',
        parent_name: mark.parent_name || 'Parent/Guardian',
        registration_number: mark.student_id?.toString() || '',
        exam_type: mark.exam_type,
        exam_date: mark.exam_date,
        created_at: mark.created_at || new Date().toISOString()
      }));

      // Filter out students without parent emails
      const validAlerts = alerts.filter(alert => alert.parent_email && alert.parent_email.includes('@'));
      
      if (validAlerts.length === 0) {
        console.log('⚠️ Found low marks but no valid parent emails');
        return {
          alertsFound: lowMarks.length,
          alertsSent: 0,
          alertsFailed: lowMarks.length,
          details: alerts,
          emailLogs: []
        };
      }

      // Send bulk alerts
      const results = await this.sendBulkLowMarksAlerts(validAlerts);

      console.log(`📧 Email Alert Summary:`, {
        totalLowMarks: lowMarks.length,
        validEmails: validAlerts.length,
        sent: results.success,
        failed: results.failed
      });

      return {
        alertsFound: lowMarks.length,
        alertsSent: results.success,
        alertsFailed: results.failed,
        details: alerts,
        emailLogs: results.emailLogs
      };
    } catch (error) {
      console.error('❌ Error in checkAndSendLowMarksAlerts:', error);
      throw error;
    }
  }

  /**
   * Check and send consolidated term alerts for all failed subjects
   */
  async sendConsolidatedLowMarksAlert(studentId: number, gradeId: number, term: string, examType: string, force: boolean = false): Promise<void> {
    try {
      // 1. Fetch ALL marks for this student, grade, term
      const allMarks = await MarksModel.findByStudentGradeTerm(studentId, gradeId, term);
      if (!allMarks.length) return;

      // 2. Filter by the specific examType we are checking for
      const relevantMarks = allMarks.filter(m => m.exam_type === examType);
      if (!relevantMarks.length) return;

      // 3. Filter subjects < 40 and ignore 'AB'
      const failedMarks = relevantMarks.filter(m => {
          if (m.marks_obtained === 'AB') return false; 
          const p = typeof m.percentage === 'number' ? m.percentage : parseFloat(m.percentage||'0');
          return p < 40;
      });

      if (failedMarks.length === 0) return;

      // 3. Consolidated tag generation (deduplication check removed)
      const consolidatedTag = `CONSOLIDATED:${term}:${examType}`;

      // 4. Send email
      const student = failedMarks[0];
      const htmlTableRows = failedMarks.map(m => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px; font-weight: 500; background-color: #fdfdfd;">${m.subject_name || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${m.marks_obtained}/${m.max_marks}</td>
          <td style="border: 1px solid #ddd; padding: 12px; color: #DC2626; font-weight: bold; text-align: center;">${typeof m.percentage === 'number' ? m.percentage.toFixed(1) : parseFloat(m.percentage||'0').toFixed(1)}%</td>
        </tr>
      `).join('');

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #1e3a8a; font-size: 26px; font-weight: 700; margin: 0;">Academic Progress Alert</h2>
            <p style="color: #64748b; font-size: 16px; margin: 5px 0 0;">${this.getFormattedExamType(examType)} - ${term}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6;">
              Dear Parent/Guardian,<br><br>
              This is a consolidated report for <strong>${student.student_name}</strong> (Grade ${student.grade_name || gradeId}). 
              Our records indicate scores below 40% in multiple subjects for this term.
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Subject</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Score</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Result</th>
              </tr>
            </thead>
            <tbody>
              ${htmlTableRows}
            </tbody>
          </table>

          <div style="padding: 20px; background-color: #fff1f2; border: 1px solid #fecaca; border-radius: 10px; margin-top: 25px;">
            <p style="margin: 0; color: #b91c1c; font-size: 14px; line-height: 1.5; font-weight: 500;">
              <strong>Note:</strong> We recommend scheduling a meeting with the subject teachers to discuss an improvement strategy before the next term exams.
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 4px 0;">Generated by EduTrack School Management System</p>
            <p style="margin: 4px 0;">Please keep this report for your records.</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"EduTrack Support" <${process.env.SMTP_USER}>`,
        to: student.parent_email,
        subject: `EduTrack Consolidated Alert: ${student.student_name} (${this.getFormattedExamType(examType)})`,
        html: htmlContent
      });

      console.log(`✅ Consolidated Term Report sent to ${student.parent_email} (Tag: ${consolidatedTag})`);

      // 5. Log ONE consolidated entry in the database
      // We use the ID of the first failed mark as the anchor, and store the tag in error_message
      await EmailLogModel.create({
        mark_id: student.id!, 
        student_id: studentId,
        student_name: student.student_name ?? undefined,
        student_class: student.grade_name ?? undefined,
        parent_email: student.parent_email || 'missing@email.com',
        email_type: 'low_mark_alert',
        status: 'sent',
        error_message: consolidatedTag, // Used for smart deduplication
        failed_subjects_count: failedMarks.length,
        sent_at: new Date().toLocaleString('sv-SE')
      });
    } catch (error) {
      console.error('❌ Error in sendConsolidatedLowMarksAlert:', error);
    }
  }

  /**
   * Generate HTML content for low marks email
   */
  private getFormattedExamType(examType: string): string {
    switch (examType) {
      case 'mid_term':
        return 'First Term';
      case 'final_term':
        return 'Second Term';
      case 'assignment':
        return 'Assignment';
      case 'quiz':
        return 'Quiz';
      case 'practical':
        return 'Practical';
      case 'first':
        return 'First Term';
      case 'second':
        return 'Second Term';
      case 'third':
        return 'Third Term';
      default:
        return examType.charAt(0).toUpperCase() + examType.slice(1) + ' Term';
    }
  }

  private generateLowMarksEmailHTML(alert: EmailAlert): string {
    const percentage = typeof alert.percentage === 'number' ? alert.percentage : parseFloat(alert.percentage || '0');
    const urgencyColor = percentage < 30 ? '#dc2626' : '#f59e0b';
    const gradeColor = this.getGradeColor(alert.grade_obtained);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Low Marks Alert - EduTrack</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">📚</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Urgent: Low Marks Alert</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">EduTrack Management System</p>
            </div>
            
            <!-- Alert Content -->
            <div style="padding: 30px 20px;">
              <div style="background: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                  Dear <strong>${alert.parent_name}</strong>,<br><br>
                  We are writing to inform you that your child, <strong>${alert.student_name}</strong>, 
                  has scored below the minimum threshold in <strong>${alert.subject_name}</strong>. 
                  We are concerned about their academic progress and want to work together to help them improve.
                </p>
              </div>
              
              <!-- Academic Performance Details -->
              <div style="background: #f1f5f9; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600;">📊 Academic Performance Details</h2>
                
                <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                        <strong style="color: #6b7280; font-size: 14px;">Student ID:</strong>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                        <span style="font-weight: 600; color: #1f2937;">${alert.registration_number || alert.student_id}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                        <strong style="color: #6b7280; font-size: 14px;">Student name:</strong>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                        <span style="font-weight: 600; color: #1f2937;">${alert.student_name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                        <strong style="color: #6b7280; font-size: 14px;">Grade:</strong>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                        <span style="font-weight: 600; color: #1f2937;">${alert.grade_name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                        <strong style="color: #6b7280; font-size: 14px;">Subject:</strong>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                        <span style="font-weight: 600; color: #1f2937;">${alert.subject_name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                        <strong style="color: #6b7280; font-size: 14px;">Exam Type:</strong>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                        <span style="font-weight: 600; color: #1f2937;">${this.getFormattedExamType(alert.exam_type)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
                        <strong style="color: #6b7280; font-size: 14px;">Marks:</strong>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                        <span style="font-weight: 600; color: ${urgencyColor}; font-size: 18px;">${alert.marks_obtained} out of ${alert.max_marks}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; vertical-align: top;">
                        <strong style="color: #6b7280; font-size: 14px;">Marks grade:</strong>
                      </td>
                      <td style="padding: 12px 0; text-align: right;">
                        <span style="background: ${gradeColor}; color: white; padding: 6px 12px; border-radius: 16px; font-weight: 700; font-size: 16px; display: inline-block;">
                          ${alert.grade_obtained}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      <strong>💡 Important Note:</strong> Your child scored ${typeof alert.percentage === 'number' ? alert.percentage.toFixed(1) : parseFloat(alert.percentage || '0').toFixed(1)}%, 
                      which is below our minimum passing grade of 40%. We believe in your child's potential 
                      and with proper support and guidance, they can achieve much better results.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Recommendations -->
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📋 Recommended Actions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 10px;">📞 <strong>Immediate Action:</strong> Schedule a meeting with the subject teacher to discuss your child's performance and identify areas needing improvement.</li>
                  <li style="margin-bottom: 10px;">📚 <strong>Study Support:</strong> Ensure your child completes homework regularly and seeks help when needed.</li>
                  <li style="margin-bottom: 10px;">🏠 <strong>Extra Practice:</strong> Consider additional practice exercises or tutoring for ${alert.subject_name}.</li>
                  <li style="margin-bottom: 10px;">📅 <strong>Daily Monitoring:</strong> Monitor homework completion and study habits at home.</li>
                  <li style="margin-bottom: 10px;">💬 <strong>Open Communication:</strong> Maintain regular contact with teachers for progress updates.</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%); color: white; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                This is an automated message from the EduTrack Management System. 
                For questions, please contact the school administration.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
                &copy; 2026 EduTrack. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get color based on grade
   */
  private getGradeColor(grade: string): string {
    const colors: {[key: string]: string} = {
      'A': '#10b981',
      'B': '#22c55e',
      'C': '#84cc16',
      'S': '#f59e0b',
      'F': '#dc2626'
    };
    return colors[grade] || '#6b7280';
  }

  /**
   * Send notification to teacher that their registration is pending approval
   */
  async sendTeacherRegistrationWaitEmail(email: string, username: string): Promise<boolean> {
    try {
      const subject = "📝 EduTrack: Registration Received - Pending Approval";
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #3b82f6; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; text-align: center; margin-bottom: 15px;">
              <span style="font-size: 32px;">🏫</span>
            </div>
            <h2 style="color: #1e3a8a; font-size: 26px; font-weight: 700; margin: 0;">Welcome to EduTrack!</h2>
            <p style="color: #64748b; font-size: 16px; margin: 5px 0 0;">School Management Excellence</p>
          </div>

          <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">
              Hello <strong>${username}</strong>,<br><br>
              Thank you for registering as a teacher on the <strong>EduTrack</strong> portal. We are excited to have you join our academic community.
            </p>
          </div>

          <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            Your registration is currently being reviewed by our administrative team. For security and verification purposes, all new teacher accounts require manual approval.
          </p>

          <div style="background-color: #fffbeb; padding: 20px; border: 1px solid #fef3c7; border-radius: 12px; margin-bottom: 25px; text-align: center;">
            <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 15px;">
              ⏳ Please wait until an administrator approves your account.
            </p>
            <p style="margin: 10px 0 0; color: #b45309; font-size: 13px;">
              You will receive another email once your registration status has been updated.
            </p>
          </div>

          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 4px 0;">This is an automated notification from <strong>EduTrack System</strong></p>
            <p style="margin: 4px 0;">If you didn't register for this account, please ignore this email.</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"EduTrack Admin" <${process.env.SCHOOL_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Registration wait email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending registration wait email:', error);
      return false;
    }
  }

  /**
   * Send notification to teacher that their registration has been approved
   */
  async sendTeacherApprovalEmail(email: string, username: string): Promise<boolean> {
    try {
      const subject = "✅ EduTrack: Account Approved - Access Granted";
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #10b981; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; text-align: center; margin-bottom: 15px;">
              <span style="font-size: 32px;">🔓</span>
            </div>
            <h2 style="color: #064e3b; font-size: 26px; font-weight: 700; margin: 0;">Registration Approved!</h2>
            <p style="color: #059669; font-size: 16px; margin: 5px 0 0;">Welcome aboard, ${username}</p>
          </div>

          <div style="background-color: #ecfdf5; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">
              Great news! Your teacher account on <strong>EduTrack</strong> has been successfully reviewed and approved by the administrator.
            </p>
          </div>

          <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 30px;">
            You can now log in to the portal using your credentials and start managing your classes, attendance, and student performance.
          </p>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #10b981; color: white; padding: 14px 30px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block; transition: background-color 0.2s;">
              Login to Your Account
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 4px 0;">Generated by EduTrack School Management System</p>
            <p style="margin: 4px 0;">If you have any issues logging in, please contact the IT support team.</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"EduTrack Admin" <${process.env.SCHOOL_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Approval email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending approval email:', error);
      return false;
    }
  }

  /**
   * Send notification to teacher that their registration has been rejected
   */
  async sendTeacherRejectionEmail(email: string, username: string): Promise<boolean> {
    try {
      const subject = "⚠️ EduTrack: Registration Status Update";
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #fee2e2; border-radius: 20px; background-color: #ffffff; color: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #ef4444; width: 60px; height: 60px; border-radius: 12px; line-height: 60px; text-align: center; margin-bottom: 15px;">
              <span style="font-size: 32px;">❌</span>
            </div>
            <h2 style="color: #991b1b; font-size: 26px; font-weight: 700; margin: 0;">Registration Update</h2>
          </div>

          <div style="background-color: #fef2f2; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">
              Hello <strong>${username}</strong>,<br><br>
              We regret to inform you that your registration request for the <strong>EduTrack</strong> portal has been declined at this time.
            </p>
          </div>

          <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            If you believe this is a mistake or if you would like more information regarding the decision, please contact the school administration office directly.
          </p>

          <p style="font-size: 15px; color: #475569; line-height: 1.6;">
            Thank you for your interest in our platform.
          </p>

          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 4px 0;">This is an automated notification from <strong>EduTrack System</strong></p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"EduTrack Admin" <${process.env.SCHOOL_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Rejection email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending rejection email:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const testMailOptions = {
        from: `"EduTrack Test" <${process.env.SMTP_USER || 'noreply@edutrack.com'}>`,
        to: process.env.TEST_EMAIL || process.env.SMTP_USER,
        subject: '🧪 EduTrack Email Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Email Configuration Test Successful</h2>
            <p>This is a test email to verify that the EduTrack email system is working correctly.</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
          </div>
        `
      };

      await this.transporter.sendMail(testMailOptions);
      console.log('✅ Email configuration test successful');
      return true;
    } catch (error) {
      console.error('❌ Email configuration test failed:', error);
      return false;
    }
  }
}

export default EmailService;
