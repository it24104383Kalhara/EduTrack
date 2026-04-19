import { pool } from '../database/db';

export interface Room {
  id: number;
  room_number: string;
  capacity: number;
  created_at: Date;
}

export interface RoomWithStudents extends Room {
  current_occupancy: number;
  students?: Array<{
    id: number;
    registration_number: string;
    student_name: string;
    grade: string;
  }>;
}

export class RoomModel {
  static async getAll(): Promise<Room[]> {
    const [rows] = await pool.query('SELECT * FROM rooms ORDER BY room_number');
    return rows as Room[];
  }

  static async getById(id: number): Promise<Room | null> {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    const rooms = rows as Room[];
    return rooms.length > 0 ? rooms[0] : null;
  }

  static async getByRoomNumber(roomNumber: string): Promise<Room | null> {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE room_number = ?', [roomNumber]);
    const rooms = rows as Room[];
    return rooms.length > 0 ? rooms[0] : null;
  }

  static async create(roomNumber: string, capacity: number): Promise<Room> {
    const [result] = await pool.query(
      'INSERT INTO rooms (room_number, capacity) VALUES (?, ?)',
      [roomNumber, capacity]
    );
    const insertId = (result as any).insertId;
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [insertId]);
    return (rows as Room[])[0];
  }

  static async update(id: number, roomNumber: string, capacity: number): Promise<Room | null> {
    await pool.query(
      'UPDATE rooms SET room_number = ?, capacity = ? WHERE id = ?',
      [roomNumber, capacity, id]
    );
    return this.getById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  static async getRoomWithOccupancy(id: number): Promise<RoomWithStudents | null> {
    const [roomRows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    const rooms = roomRows as Room[];
    
    if (rooms.length === 0) return null;
    
    const room = rooms[0];
    
    const [studentRows] = await pool.query(
      `SELECT id, registration_number, student_name, grade 
       FROM students 
       WHERE assigned_room = ?`,
      [id]
    );
    
    return {
      ...room,
      current_occupancy: (studentRows as any[]).length,
      students: studentRows as any[]
    };
  }

  static async getAllWithOccupancy(): Promise<RoomWithStudents[]> {
    const [roomRows] = await pool.query('SELECT * FROM rooms ORDER BY room_number');
    const rooms = roomRows as Room[];
    
    const roomsWithOccupancy: RoomWithStudents[] = [];
    
    for (const room of rooms) {
      const [studentRows] = await pool.query(
        `SELECT id, registration_number, student_name, grade 
         FROM students 
         WHERE assigned_room = ?`,
        [room.id]
      );
      
      roomsWithOccupancy.push({
        ...room,
        current_occupancy: (studentRows as any[]).length,
        students: studentRows as any[]
      });
    }
    
    return roomsWithOccupancy;
  }

  static async isRoomFull(id: number): Promise<boolean> {
    const room = await this.getRoomWithOccupancy(id);
    if (!room) return true;
    return room.current_occupancy >= room.capacity;
  }

  static async getAvailableRooms(): Promise<RoomWithStudents[]> {
    const allRooms = await this.getAllWithOccupancy();
    return allRooms.filter(room => room.current_occupancy < room.capacity);
  }
}
