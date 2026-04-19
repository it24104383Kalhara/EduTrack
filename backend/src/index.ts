import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/sqlite';

// Import routes
import roomRoutes from './routes/rooms';
import studentRoutes from './routes/students';
import paymentRoutes from './routes/payments';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase().catch(console.error);

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('EduTrack Hostel Management Backend is running!');
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'EduTrack Hostel Management'
    });
});

app.listen(port, () => {
    console.log(`EduTrack Hostel Management Server is running on port ${port}`);
});
