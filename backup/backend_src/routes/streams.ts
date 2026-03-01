import express from 'express';

const router = express.Router();

// Default streams
const DEFAULT_STREAMS = ['Science', 'Commerce', 'Arts'];

// GET /api/streams - Get all streams
router.get('/', (req, res) => {
  try {
    // For now, return default streams
    // In future, this could be enhanced to fetch from database
    const streams = DEFAULT_STREAMS;
    res.json(streams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching streams', error });
  }
});

export default router;
