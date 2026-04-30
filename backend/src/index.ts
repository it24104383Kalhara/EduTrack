import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/roomRoutes';
import studentRoutes from './routes/studentRoutes';
import paymentRoutes from './routes/paymentRoutes';
import emailRoutes from './routes/emailRoutes';
import authRoutes from './routes/authRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import { initCronJobs } from './cron/paymentJobs';
import { db } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize cron scheduler
initCronJobs();

app.get('/', (req, res) => {
    res.send('EduTrack Hostel Management Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/attendance', attendanceRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
