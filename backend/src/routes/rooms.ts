import { Router } from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms
} from '../controllers/roomController';

const router = Router();

// GET /api/rooms - Get all rooms
router.get('/', getAllRooms);

// GET /api/rooms/available - Get available rooms
router.get('/available', getAvailableRooms);

// GET /api/rooms/:id - Get room by ID
router.get('/:id', getRoomById);

// POST /api/rooms - Create new room
router.post('/', createRoom);

// PUT /api/rooms/:id - Update room
router.put('/:id', updateRoom);

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', deleteRoom);

export default router;
