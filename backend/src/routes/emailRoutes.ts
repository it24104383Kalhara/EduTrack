import express from 'express';
import { db } from '../db';

const router = express.Router();

// GET /api/emails — all email logs with student names
router.get('/', (req, res) => {
    const query = `
        SELECT 
            e.id,
            e.student_id,
            e.parent_email,
            e.email_type,
            e.status,
            e.sent_at,
            e.error_message,
            e.created_at,
            CONCAT(s.first_name, ' ', s.last_name) AS student_name
        FROM email_logs e
        LEFT JOIN students s ON e.student_id = s.id
        ORDER BY e.sent_at DESC
    `;
    db.all(query, (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

export default router;
