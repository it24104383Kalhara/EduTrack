import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sportActivityRoutes from './routes/sportActivityRoutes';
import membershipRoutes from './routes/membershipRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import facilityRoutes from './routes/facilityRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import alertRoutes from './routes/alertRoutes';
import achievementRoutes from './routes/achievementRoutes';
import studentRoutes from './routes/studentRoutes';
import attendanceReportRoutes from './routes/attendanceReportRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sports', sportActivityRoutes);
app.use('/api/sports/memberships', membershipRoutes);
app.use('/api/sports/inventory', inventoryRoutes);
app.use('/api/sports/facilities', facilityRoutes);
app.use('/api/sports/attendance', attendanceRoutes);
app.use('/api/sports/alerts', alertRoutes);
app.use('/api/sports/achievements', achievementRoutes);
app.use('/api/sports/students', studentRoutes);
app.use('/api/sports/reports', attendanceReportRoutes);

app.get('/', (req, res) => {
    res.send('EduTrack Backend is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
