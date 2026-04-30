import nodeCron from 'node-cron';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { db } from '../db';

dotenv.config();

const createTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

export const sendEmail = async (
    to: string,
    subject: string,
    text: string,
    studentId: number | null = null,
    emailType: string = 'payment_reminder'
) => {
    try {
        const transporter = createTransporter();
        console.log(`\n--- [EMAIL LOG] ---`);
        console.log(`To: ${to} | Subject: ${subject}`);

        const info = await transporter.sendMail({
            from: `"EduHostel Admin" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text
        });

        console.log(`Email sent! Message ID: ${info.messageId}`);

        // Log to email_logs table
        db.run(
            'INSERT INTO email_logs (student_id, parent_email, email_type, status) VALUES (?, ?, ?, ?)',
            [studentId, to, emailType, 'sent'],
            (err) => {
                if (err) console.error('Failed to log email:', err.message);
                else console.log(`Logged to email_logs for: ${to}`);
            }
        );

        return info.messageId;
    } catch (e: any) {
        console.error('Email FAILED:', e.message);

        // Log failure to email_logs table too
        db.run(
            'INSERT INTO email_logs (student_id, parent_email, email_type, status, error_message) VALUES (?, ?, ?, ?, ?)',
            [studentId, to, emailType, 'failed', e.message],
            (err) => {
                if (err) console.error('Failed to log email error:', err.message);
            }
        );

        return null;
    }
};

export const initCronJobs = () => {
    // Daily Overdue Check (Midnight)
    nodeCron.schedule('0 0 * * *', () => {
        console.log('Running daily overdue check...');
        const todayStr = new Date().toISOString().split('T')[0];
        const query = `
            SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.parent_email 
            FROM payments p JOIN students s ON p.student_id = s.id
            WHERE p.status = 'pending' AND p.due_date < ?
        `;
        db.all(query, [todayStr], (err: any, overdues?: any[]) => {
            if (err) return console.error('Overdue check error:', err);
            if (overdues) {
                for (const p of overdues) {
                    sendEmail(
                        p.parent_email,
                        `[URGENT] Overdue Hostel Payment - ${p.student_name}`,
                        `Dear Parent,\n\nYour child ${p.student_name}'s payment of $${p.amount} is OVERDUE (Due on ${p.due_date}).\n\nPlease settle this immediately.\n\nThank you,\nEduHostel Admin`,
                        p.student_id,
                        'overdue_alert'
                    );
                }
            }
        });
    });

    // Monthly Reminder (5th of every month, 9 AM)
    nodeCron.schedule('0 9 5 * *', () => {
        console.log('Running monthly reminder...');
        const now = new Date();
        const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;
        const query = `
            SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.parent_email 
            FROM payments p JOIN students s ON p.student_id = s.id
            WHERE p.status = 'pending' AND p.due_date = ?
        `;
        db.all(query, [dueDate], (err: any, payments?: any[]) => {
            if (err) return console.error('Monthly reminder error:', err);
            if (payments) {
                for (const p of payments) {
                    sendEmail(
                        p.parent_email,
                        `Hostel Payment Reminder - Due ${dueDate}`,
                        `Dear Parent,\n\nThe hostel fee for ${p.student_name} ($${p.amount}) is due on ${dueDate}.\n\nPlease ensure timely payment.\n\nThank you,\nEduHostel Admin`,
                        p.student_id,
                        'monthly_reminder'
                    );
                }
            }
        });
    });
};
