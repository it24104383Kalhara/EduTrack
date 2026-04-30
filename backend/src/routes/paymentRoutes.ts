import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db';
import { sendEmail } from '../cron/paymentJobs';

const router = express.Router();

// Validation middleware
const validate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const paymentValidationRules = [
    body('student_id').isInt().withMessage('Student ID must be an integer'),
    body('amount').isNumeric().withMessage('Amount must be a number')
        .custom((value) => value > 0).withMessage('Amount must be greater than zero'),
    body('due_date').notEmpty().withMessage('Due date is required')
        .isISO8601().withMessage('Due date must be a valid ISO8601 date (YYYY-MM-DD)'),
];

// Get all payments along with student details
router.get('/', (req, res) => {
    const query = `
        SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.parent_email 
        FROM payments p 
        JOIN students s ON p.student_id = s.id
        ORDER BY p.id DESC
    `;
    db.all(query, (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create a new payment record
router.post('/', paymentValidationRules, validate, (req: express.Request, res: express.Response) => {
    const { student_id, amount, due_date } = req.body;
    db.run('INSERT INTO payments (student_id, amount, due_date) VALUES (?, ?, ?)', [student_id, amount, due_date], function(this: any, err: any) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, message: 'Payment created', student_id, amount, due_date, status: 'pending' });
    });
});

// Mark payment as paid
router.put('/:id/pay', (req, res) => {
    const { id } = req.params;
    db.run('UPDATE payments SET status = ? WHERE id = ?', ['paid', id], (err: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Payment marked as paid' });
    });
});

// Mark payment as unpaid (pending)
router.put('/:id/unpay', (req, res) => {
    const { id } = req.params;
    db.run('UPDATE payments SET status = ? WHERE id = ?', ['pending', id], (err: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Payment marked as unpaid' });
    });
});

// Send reminder emails to ALL parents with pending payments
router.post('/send-all-reminders', (req, res) => {
    const query = `
        SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.parent_email 
        FROM payments p 
        JOIN students s ON p.student_id = s.id
        WHERE p.status = 'pending'
        ORDER BY p.due_date ASC
    `;

    db.all(query, async (err: any, payments?: any[]) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!payments || payments.length === 0) {
            return res.json({ message: 'No pending payments found. No emails were sent.' });
        }

        let sentCount = 0;
        for (const payment of payments) {
            const subject = `[EduHostel] Payment Reminder – Due on ${payment.due_date}`;
            const text = `Dear Parent,\n\nThis is a reminder that the hostel fee for your child, ${payment.student_name}, of $${payment.amount} is due on ${payment.due_date}.\n\nPlease ensure the payment is made on time.\nIf you have already settled this, please ignore this message.\n\nThank you,\nEduHostel Admin`;

            const result = await sendEmail(payment.parent_email, subject, text, payment.student_id);
            if (result) sentCount++;
        }

        res.json({
            message: sentCount > 0
                ? `✅ Success! ${sentCount} reminder email(s) sent to parents.`
                : `⚠️ No emails could be sent. Check your SMTP settings in the .env file.`
        });
    });
});

export default router;
