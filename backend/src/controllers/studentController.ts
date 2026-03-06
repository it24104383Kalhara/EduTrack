import { Request, Response } from 'express';

// Mock data for students
const mockStudents = [
    { id: 101, name: 'John Doe', grade: '10A', classTeacherName: 'Mr. Perera' },
    { id: 102, name: 'Jane Smith', grade: '10B', classTeacherName: 'Mrs. Silva' },
    { id: 103, name: 'Alice Johnson', grade: '11A', classTeacherName: 'Mr. Fernando' },
    { id: 104, name: 'Bob Brown', grade: '11C', classTeacherName: 'Ms. De Silva' },
    { id: 105, name: 'Charlie Davis', grade: '12B', classTeacherName: 'Mr. Jayasinghe' },
    { id: 106, name: 'Diana Evans', grade: '9A', classTeacherName: 'Mrs. Rathnayake' },
    { id: 107, name: 'Ethan Harris', grade: '9C', classTeacherName: 'Mr. Bandara' },
    { id: 108, name: 'Fiona Clark', grade: '10C', classTeacherName: 'Ms. Kumari' },
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
