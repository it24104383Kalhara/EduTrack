import { getDb } from '../database/sqlite';

export interface Room {
  id: number;
  room_number: string;
  capacity: number;
  created_at: string;
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
    const db = getDb();
    const rows = await db.all('SELECT * FROM rooms ORDER BY room_number');
    return rows as Room[];
  }

  static async getById(id: number): Promise<Room | null> {
    const db = getDb();
    const row = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    return row as Room || null;
  }

  static async getByRoomNumber(roomNumber: string): Promise<Room | null> {
    const db = getDb();
    const row = await db.get('SELECT * FROM rooms WHERE room_number = ?', [roomNumber]);
    return row as Room || null;
  }

  static async create(roomNumber: string, capacity: number): Promise<Room> {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO rooms (room_number, capacity) VALUES (?, ?)',
      [roomNumber, capacity]
    );
    const row = await db.get('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
    return row as Room;
  }

  static async update(id: number, roomNumber: string, capacity: number): Promise<Room | null> {
    const db = getDb();
    await db.run(
      'UPDATE rooms SET room_number = ?, capacity = ? WHERE id = ?',
      [roomNumber, capacity, id]
    );
    return this.getById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const db = getDb();
    const result = await db.run('DELETE FROM rooms WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  static async getRoomWithOccupancy(id: number): Promise<RoomWithStudents | null> {
    const db = getDb();
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    
    if (!room) return null;
    
    const students = await db.all(
      `SELECT id, registration_number, student_name, grade 
       FROM students 
       WHERE assigned_room = ?`,
      [id]
    );
    
    return {
      ...room,
      current_occupancy: students.length,
      students
    };
  }

  static async getAllWithOccupancy(): Promise<RoomWithStudents[]> {
    const db = getDb();
    const rooms = await db.all('SELECT * FROM rooms ORDER BY room_number');
    
    const roomsWithOccupancy: RoomWithStudents[] = [];
    
    for (const room of rooms) {
      const students = await db.all(
        `SELECT id, registration_number, student_name, grade 
         FROM students 
         WHERE assigned_room = ?`,
        [room.id]
      );
      
      roomsWithOccupancy.push({
        ...room,
        current_occupancy: students.length,
        students
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
