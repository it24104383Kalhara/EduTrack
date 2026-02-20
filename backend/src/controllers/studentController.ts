import { Request, Response } from 'express';

// Mock data for students
const mockStudents = [
    { id: 101, name: 'John Doe', grade: '10A' },
    { id: 102, name: 'Jane Smith', grade: '10B' },
    { id: 103, name: 'Alice Johnson', grade: '11A' },
    { id: 104, name: 'Bob Brown', grade: '11C' },
    { id: 105, name: 'Charlie Davis', grade: '12B' },
    { id: 106, name: 'Diana Evans', grade: '9A' },
    { id: 107, name: 'Ethan Harris', grade: '9C' },
    { id: 108, name: 'Fiona Clark', grade: '10C' },
];

export const searchStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = (req.query.q as string || '').toLowerCase();

        // Filter mock students by name or ID
        const results = mockStudents.filter(student =>
            student.name.toLowerCase().includes(query) ||
            student.id.toString().includes(query)
        );

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search students' });
    }
};
