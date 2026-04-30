import express from 'express';
import { db } from '../db';

const router = express.Router();

// IOT ENDPOINT: Scanned by RFID Device (UID)
router.post('/scan', (req, res) => {
    const { rfid_tag } = req.body;
    if (!rfid_tag) return res.status(400).json({ error: 'RFID Tag UID required' });

    // 1. Find the student with this RFID TAG
    db.get('SELECT * FROM students WHERE rfid_tag = ?', [rfid_tag], (err: any, student: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) return res.status(404).json({ error: 'RFID Tag not registered to any student' });

        const studentId = student.id;
        const today = new Date().toISOString().split('T')[0];

        // 2. Check if student has an active check-in record for today
        // (Active check-in = check_out is NULL and scan_date is TODAY)
        db.get('SELECT * FROM attendance WHERE student_id = ? AND scan_date = ? AND check_out IS NULL', [studentId, today], (err: any, lastScan: any) => {
            if (err) return res.status(500).json({ error: err.message });

            if (lastScan) {
                // ALREADY CHECKED IN -> DO CHECK-OUT
                db.run('UPDATE attendance SET check_out = CURRENT_TIMESTAMP WHERE id = ?', [lastScan.id], (err: any) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ 
                        message: `Check-OUT recorded for ${student.first_name}`, 
                        type: 'OUT',
                        student: { name: `${student.first_name} ${student.last_name}`, id: studentId }
                    });
                });
            } else {
                // NOT IN -> DO CHECK-IN
                db.run('INSERT INTO attendance (student_id, scan_date) VALUES (?, ?)', [studentId, today], (err: any) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ 
                        message: `Check-IN recorded for ${student.first_name}`, 
                        type: 'IN',
                        student: { name: `${student.first_name} ${student.last_name}`, id: studentId }
                    });
                });
            }
        });
    });
});

// GET CURRENT STATUS (In or Out for all students)
router.get('/status', (req, res) => {
    const query = `
        SELECT 
            s.id, s.first_name, s.last_name, s.rfid_tag,
            r.room_number,
            CASE 
                WHEN a.id IS NOT NULL AND a.check_out IS NULL THEN 'PRESENT' 
                ELSE 'AWAY' 
            END as current_status,
            a.check_in as last_scan
        FROM students s
        LEFT JOIN rooms r ON s.room_id = r.id
        LEFT JOIN attendance a ON s.id = a.student_id AND a.scan_date = CURRENT_DATE AND a.check_out IS NULL
        ORDER BY s.id ASC
    `;
    db.all(query, (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET ATTENDANCE LOGS
router.get('/logs', (req, res) => {
    const query = `
        SELECT a.*, s.first_name, s.last_name 
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        ORDER BY a.check_in DESC
        LIMIT 50
    `;
    db.all(query, (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

export default router;
