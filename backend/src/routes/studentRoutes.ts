import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db';

const router = express.Router();

// Validation middleware
const validate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const studentValidationRules = [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('parent_email').isEmail().withMessage('Invalid parent email address'),
    body('parent_phone').notEmpty().withMessage('Parent phone number is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
];

// Get all students
router.get('/', (req, res) => {
    db.all('SELECT * FROM students', (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get unassigned students
router.get('/unassigned', (req, res) => {
    db.all('SELECT * FROM students WHERE room_id IS NULL OR room_id = ""', (err: any, rows: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Register new student (without room assignment)
router.post('/register', studentValidationRules, validate, (req: express.Request, res: express.Response) => {
    let { 
        first_name, last_name, dob, gender, nationality, religion, ethnicity, address,
        parent_type, parent_name, parent_phone, parent_email, parent_gender, parent_religion,
        parent_ethnicity, parent_nationality, parent_address, rfid_tag
    } = req.body;

    // Convert empty RFID to null to avoid UNIQUE constraint issues
    if (!rfid_tag || rfid_tag.trim() === '') rfid_tag = null;
    
    db.run(
        `INSERT INTO students (
            first_name, last_name, dob, gender, nationality, religion, ethnicity, address,
            parent_type, parent_name, parent_phone, parent_email, parent_gender, parent_religion,
            parent_ethnicity, parent_nationality, parent_address, rfid_tag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
            first_name, last_name, dob, gender, nationality, religion, ethnicity, address,
            parent_type, parent_name, parent_phone, parent_email, parent_gender, parent_religion,
            parent_ethnicity, parent_nationality, parent_address, rfid_tag
        ], 
        function(this: any, err: any) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, ...req.body, room_id: null });
        }
    );
});

// Assign student to a room
router.post('/assign', (req, res) => {
    const { student_id, room_id } = req.body;
    
    db.get('SELECT capacity, occupied FROM rooms WHERE id = ?', [room_id], (err, room: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        
        if (room.occupied >= room.capacity) {
            return res.status(400).json({ error: 'Room is full! Maximum 5 students allowed.' });
        }
        
        db.run('UPDATE students SET room_id = ? WHERE id = ?', [room_id, student_id], (err: any) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.run('UPDATE rooms SET occupied = occupied + 1 WHERE id = ?', [room_id], (err: any) => {
                if (err) console.error('Error updating room occupancy', err.message);
                res.status(200).json({ message: 'Student assigned to room successfully', student_id, room_id });
            });
        });
    });
});

// Get student by ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM students WHERE id = ?', [req.params.id], (err: any, row: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Student not found' });
        res.json(row);
    });
});

// Update student
router.put('/:id', studentValidationRules, validate, (req: express.Request, res: express.Response) => {
    let { 
        first_name, last_name, dob, gender, nationality, religion, ethnicity, address,
        parent_type, parent_name, parent_phone, parent_email, parent_gender, parent_religion,
        parent_ethnicity, parent_nationality, parent_address, rfid_tag
    } = req.body;

    // Convert empty RFID to null to avoid UNIQUE constraint issues
    if (!rfid_tag || rfid_tag.trim() === '') rfid_tag = null;
    
    db.run(
        `UPDATE students SET
            first_name = ?, last_name = ?, dob = ?, gender = ?, nationality = ?, religion = ?, ethnicity = ?, address = ?,
            parent_type = ?, parent_name = ?, parent_phone = ?, parent_email = ?, parent_gender = ?, parent_religion = ?,
            parent_ethnicity = ?, parent_nationality = ?, parent_address = ?, rfid_tag = ?
        WHERE id = ?`, 
        [
            first_name, last_name, dob, gender, nationality, religion, ethnicity, address,
            parent_type, parent_name, parent_phone, parent_email, parent_gender, parent_religion,
            parent_ethnicity, parent_nationality, parent_address, rfid_tag,
            req.params.id
        ], 
        (err: any, result: any) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' });
            res.status(200).json({ message: 'Student updated successfully' });
        }
    );
});

// Delete student
router.delete('/:id', (req, res) => {
    db.get('SELECT room_id FROM students WHERE id = ?', [req.params.id], (err, student: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) return res.status(404).json({ error: 'Student not found' });
        
        db.run('DELETE FROM students WHERE id = ?', [req.params.id], (err: any) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // If the student was assigned to a room, decrement occupancy
            if (student.room_id) {
                db.run('UPDATE rooms SET occupied = CASE WHEN occupied > 0 THEN occupied - 1 ELSE 0 END WHERE id = ?', [student.room_id], (err: any) => {
                    if (err) console.error('Error updating room occupancy upon student deletion', err.message);
                    res.status(200).json({ message: 'Student deleted successfully' });
                });
            } else {
                res.status(200).json({ message: 'Student deleted successfully' });
            }
        });
    });
});

// Unassign student from room
router.post('/unassign', (req, res) => {
    const { student_id } = req.body;
    
    db.get('SELECT room_id FROM students WHERE id = ?', [student_id], (err, student: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student || !student.room_id) return res.status(400).json({ error: 'Student is not assigned to a room' });
        
        const old_room_id = student.room_id;
        
        db.run('UPDATE students SET room_id = NULL WHERE id = ?', [student_id], (err: any) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.run('UPDATE rooms SET occupied = CASE WHEN occupied > 0 THEN occupied - 1 ELSE 0 END WHERE id = ?', [old_room_id], (err: any) => {
                if (err) console.error('Error updating room occupancy', err.message);
                res.status(200).json({ message: 'Student removed from room' });
            });
        });
    });
});

// Reassign student to a different room
router.post('/reassign', (req, res) => {
    const { student_id, new_room_id } = req.body;
    
    db.get('SELECT room_id FROM students WHERE id = ?', [student_id], (err, student: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!student) return res.status(404).json({ error: 'Student not found' });
        
        const old_room_id = student.room_id;
        
        // Finalize reassignment logic
        db.get('SELECT occupied, capacity FROM rooms WHERE id = ?', [new_room_id], (err, newRoom: any) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!newRoom) return res.status(404).json({ error: 'New room not found' });
            if (newRoom.occupied >= newRoom.capacity) return res.status(400).json({ error: 'Target room is full' });

            db.run('UPDATE students SET room_id = ? WHERE id = ?', [new_room_id, student_id], (err: any) => {
                if (err) return res.status(500).json({ error: err.message });

                // Decrement old room
                if (old_room_id) {
                    db.run('UPDATE rooms SET occupied = CASE WHEN occupied > 0 THEN occupied - 1 ELSE 0 END WHERE id = ?', [old_room_id]);
                }
                
                // Increment new room
                db.run('UPDATE rooms SET occupied = occupied + 1 WHERE id = ?', [new_room_id], (err: any) => {
                    res.status(200).json({ message: 'Student reassigned successfully' });
                });
            });
        });
    });
});

export default router;
