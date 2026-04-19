import db from '../database/mysql';

export interface Room {
  id?: number;
  room_number: string;
  capacity: number;
  current_occupancy: number;
  floor_number?: string;
  room_type?: 'single' | 'double' | 'dormitory';
  status?: 'available' | 'maintenance' | 'full';
  created_at?: Date;
  updated_at?: Date;
}

export class RoomModel {
  // Get all rooms
  static async getAll(): Promise<Room[]> {
    const sql = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM students s WHERE s.assigned_room = r.id AND s.status = 'active') as assigned_count
      FROM rooms r 
      ORDER BY r.room_number
    `;
    return await db.query(sql);
  }

  // Get room by ID
  static async getById(id: number): Promise<Room | null> {
    const sql = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM students s WHERE s.assigned_room = r.id AND s.status = 'active') as assigned_count
      FROM rooms r 
      WHERE r.id = ?
    `;
    const rooms = await db.query(sql, [id]);
    return rooms.length > 0 ? rooms[0] : null;
  }

  // Get room by room number
  static async getByRoomNumber(roomNumber: string): Promise<Room | null> {
    const sql = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM students s WHERE s.assigned_room = r.id AND s.status = 'active') as assigned_count
      FROM rooms r 
      WHERE r.room_number = ?
    `;
    const rooms = await db.query(sql, [roomNumber]);
    return rooms.length > 0 ? rooms[0] : null;
  }

  // Create new room
  static async create(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const sql = `
      INSERT INTO rooms (room_number, capacity, current_occupancy, floor_number, room_type, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await db.query(sql, [
      room.room_number,
      room.capacity,
      room.current_occupancy || 0,
      room.floor_number || null,
      room.room_type || 'dormitory',
      room.status || 'available'
    ]);
    return (result as any).insertId;
  }

  // Update room
  static async update(id: number, room: Partial<Room>): Promise<boolean> {
    const fields = [];
    const values = [];

    if (room.room_number !== undefined) {
      fields.push('room_number = ?');
      values.push(room.room_number);
    }
    if (room.capacity !== undefined) {
      fields.push('capacity = ?');
      values.push(room.capacity);
    }
    if (room.current_occupancy !== undefined) {
      fields.push('current_occupancy = ?');
      values.push(room.current_occupancy);
    }
    if (room.floor_number !== undefined) {
      fields.push('floor_number = ?');
      values.push(room.floor_number);
    }
    if (room.room_type !== undefined) {
      fields.push('room_type = ?');
      values.push(room.room_type);
    }
    if (room.status !== undefined) {
      fields.push('status = ?');
      values.push(room.status);
    }

    if (fields.length === 0) return false;

    const sql = `UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const result = await db.query(sql, values);
    return (result as any).affectedRows > 0;
  }

  // Delete room
  static async delete(id: number): Promise<boolean> {
    // Check if room has assigned students
    const students = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE assigned_room = ? AND status = "active"',
      [id]
    );

    if ((students as any)[0].count > 0) {
      throw new Error('Cannot delete room with assigned students');
    }

    const sql = 'DELETE FROM rooms WHERE id = ?';
    const result = await db.query(sql, [id]);
    return (result as any).affectedRows > 0;
  }

  // Get available rooms
  static async getAvailable(): Promise<Room[]> {
    const sql = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM students s WHERE s.assigned_room = r.id AND s.status = 'active') as assigned_count
      FROM rooms r 
      WHERE r.current_occupancy < r.capacity AND r.status = 'available'
      ORDER BY r.room_number
    `;
    return await db.query(sql);
  }

  // Check room availability
  static async isAvailable(id: number): Promise<boolean> {
    const room = await this.getById(id);
    if (!room) return false;
    return room.current_occupancy < room.capacity;
  }

  // Update room occupancy
  static async updateOccupancy(id: number, change: number): Promise<boolean> {
    const sql = `
      UPDATE rooms 
      SET current_occupancy = current_occupancy + ?,
          status = CASE 
            WHEN current_occupancy + ? >= capacity THEN 'full'
            WHEN current_occupancy + ? = 0 THEN 'available'
            ELSE 'available'
          END
      WHERE id = ? AND (current_occupancy + ?) >= 0 AND (current_occupancy + ?) <= capacity
    `;
    const result = await db.query(sql, [change, change, change, id, change, change]);
    return (result as any).affectedRows > 0;
  }

  // Get room statistics
  static async getStatistics(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_rooms,
        SUM(current_occupancy) as total_occupancy,
        SUM(capacity) as total_capacity,
        COUNT(CASE WHEN current_occupancy = 0 THEN 1 END) as empty_rooms,
        COUNT(CASE WHEN current_occupancy >= capacity THEN 1 END) as full_rooms,
        COUNT(CASE WHEN current_occupancy > 0 AND current_occupancy < capacity THEN 1 END) as partially_filled_rooms,
        ROUND((SUM(current_occupancy) / SUM(capacity)) * 100, 2) as occupancy_percentage
      FROM rooms
    `;
    const stats = await db.query(sql);
    return stats[0];
  }

  // Search rooms
  static async search(query: string): Promise<Room[]> {
    const sql = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM students s WHERE s.assigned_room = r.id AND s.status = 'active') as assigned_count
      FROM rooms r 
      WHERE r.room_number LIKE ? OR r.floor_number LIKE ?
      ORDER BY r.room_number
    `;
    const searchTerm = `%${query}%`;
    return await db.query(sql, [searchTerm, searchTerm]);
  }
}
