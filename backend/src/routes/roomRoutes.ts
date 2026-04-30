import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/', (req, res) => {
    db.all('SELECT * FROM rooms', (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM rooms WHERE id = ?', [id], (err: any, room: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        
        db.all('SELECT * FROM students WHERE room_id = ?', [id], (err: any, students: any) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...room, students });
        });
    });
});

export default router;
