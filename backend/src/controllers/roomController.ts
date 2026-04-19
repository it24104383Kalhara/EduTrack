import { Request, Response } from 'express';
import { RoomModel } from '../models/RoomSQLite';

export const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomModel.getAllWithOccupancy();
    res.json({
      success: true,
      data: rooms,
      message: 'Rooms retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roomId = Array.isArray(id) ? id[0] : id;
    const room = await RoomModel.getRoomWithOccupancy(parseInt(roomId));
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    res.json({
      success: true,
      data: room,
      message: 'Room retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room'
    });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { room_number, capacity } = req.body;
    
    if (!room_number || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room number and capacity are required'
      });
    }
    
    if (capacity < 1 || capacity > 5) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be between 1 and 5'
      });
    }
    
    // Check if room number already exists
    const existingRoom = await RoomModel.getByRoomNumber(room_number);
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }
    
    const room = await RoomModel.create(room_number, parseInt(capacity));
    
    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { room_number, capacity } = req.body;
    
    if (!room_number || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room number and capacity are required'
      });
    }
    
    if (capacity < 1 || capacity > 5) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be between 1 and 5'
      });
    }
    
    // Check if room exists
    const existingRoom = await RoomModel.getById(parseInt(Array.isArray(id) ? id[0] : id));
    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if new room number conflicts with another room
    const conflictingRoom = await RoomModel.getByRoomNumber(room_number);
    if (conflictingRoom && conflictingRoom.id !== parseInt(Array.isArray(id) ? id[0] : id)) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }
    
    const room = await RoomModel.update(parseInt(Array.isArray(id) ? id[0] : id), room_number, parseInt(capacity));
    
    res.json({
      success: true,
      data: room,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room'
    });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if room exists
    const room = await RoomModel.getRoomWithOccupancy(parseInt(Array.isArray(id) ? id[0] : id));
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if room has students
    if (room.current_occupancy > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with assigned students'
      });
    }
    
    const deleted = await RoomModel.delete(parseInt(Array.isArray(id) ? id[0] : id));
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete room'
      });
    }
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
};

export const getAvailableRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomModel.getAvailableRooms();
    res.json({
      success: true,
      data: rooms,
      message: 'Available rooms retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available rooms'
    });
  }
};
