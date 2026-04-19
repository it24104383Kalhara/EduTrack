import { Request, Response } from 'express';
import { StudentModel } from '../models/StudentSQLite';
import { RoomModel } from '../models/RoomSQLite';

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await StudentModel.getAll();
    res.json({
      success: true,
      data: students,
      message: 'Students retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = Array.isArray(id) ? id[0] : id;
    const student = await StudentModel.getById(parseInt(studentId));
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      data: student,
      message: 'Student retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student'
    });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      student_name,
      grade,
      address,
      parent_name,
      parent_phone,
      parent_email
    } = req.body;
    
    if (!student_name || !grade || !address || !parent_name || !parent_phone) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    const student = await StudentModel.create({
      student_name,
      grade,
      address,
      parent_name,
      parent_phone,
      parent_email
    } as Omit<any, 'id' | 'registered_at' | 'assigned_room'>);
    
    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student'
    });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = Array.isArray(id) ? id[0] : id;
    const updateData = req.body;
    
    // Check if student exists
    const existingStudent = await StudentModel.getById(parseInt(studentId));
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const student = await StudentModel.update(parseInt(studentId), updateData);
    
    res.json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student'
    });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = Array.isArray(id) ? id[0] : id;
    
    // Check if student exists
    const existingStudent = await StudentModel.getById(parseInt(studentId));
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const deleted = await StudentModel.delete(parseInt(studentId));
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete student'
      });
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
  }
};

export const assignStudentToRoom = async (req: Request, res: Response) => {
  try {
    const { studentId, roomId } = req.body;
    
    if (!studentId || !roomId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Room ID are required'
      });
    }
    
    // Check if student exists
    const student = await StudentModel.getById(parseInt(studentId));
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if room exists
    const room = await RoomModel.getById(parseInt(roomId));
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if room is full
    const isFull = await RoomModel.isRoomFull(parseInt(roomId));
    if (isFull) {
      return res.status(400).json({
        success: false,
        message: 'Room is already full'
      });
    }
    
    // Assign student to room
    const assigned = await StudentModel.assignToRoom(parseInt(studentId), parseInt(roomId));
    
    if (assigned) {
      res.json({
        success: true,
        message: 'Student assigned to room successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to assign student to room'
      });
    }
  } catch (error) {
    console.error('Error assigning student to room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign student to room'
    });
  }
};

export const removeStudentFromRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = Array.isArray(id) ? id[0] : id;
    
    // Check if student exists
    const student = await StudentModel.getById(parseInt(studentId));
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    await StudentModel.removeFromRoom(parseInt(studentId));
    
    res.json({
      success: true,
      message: 'Student removed from room successfully'
    });
  } catch (error) {
    console.error('Error removing student from room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove student from room'
    });
  }
};

export const getUnassignedStudents = async (req: Request, res: Response) => {
  try {
    const students = await StudentModel.getUnassignedStudents();
    res.json({
      success: true,
      data: students,
      message: 'Unassigned students retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching unassigned students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned students'
    });
  }
};

export const getStudentsInRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const roomIdParam = Array.isArray(roomId) ? roomId[0] : roomId;
    
    // Check if room exists
    const room = await RoomModel.getById(parseInt(roomIdParam));
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    const students = await StudentModel.getStudentsInRoom(parseInt(roomIdParam));
    
    res.json({
      success: true,
      data: students,
      message: 'Students in room retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching students in room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students in room'
    });
  }
};
