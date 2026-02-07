import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sportActivityRoutes from './routes/sportActivityRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sports', sportActivityRoutes);

app.get('/', (req, res) => {
    res.send('EduTrack Backend is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
