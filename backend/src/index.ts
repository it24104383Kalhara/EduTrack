import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { StudentModel } from './models/Student';
import { errorHandler } from './middleware/validation';
import studentRoutes from './routes/students';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'EduTrack Backend API',
        version: '1.0.0',
        endpoints: {
            students: '/api/students',
            register: '/api/students/register'
        }
    });
});

// API Routes
app.use('/api/students', studentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Initialize database and start server
const initializeServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database');
            process.exit(1);
        }

        // Create students table
        await StudentModel.createTable();
        console.log('Database initialized successfully');

        // Start server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`API endpoints available at:`);
            console.log(`  - GET  /api/students - Get all students`);
            console.log(`  - POST /api/students/register - Register new student`);
            console.log(`  - GET  /api/students/:id - Get student by ID`);
            console.log(`  - PUT  /api/students/:id - Update student`);
            console.log(`  - DELETE /api/students/:id - Delete student`);
        });
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
};

initializeServer();
