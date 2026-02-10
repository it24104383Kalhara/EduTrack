import pool from '../config/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export interface Facility {
    id?: number;
    name: string;
    type: 'Ground' | 'Room' | 'Hall' | 'Court' | 'Pool';
    capacity?: number;
    location_description?: string;
}

export interface Booking {
    id?: number;
    facility_id: number;
    booked_by_id: number;
    start_time: string; // ISO datetime string
    end_time: string;
    purpose?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

// Facility CRUD
export const getAllFacilities = async (): Promise<Facility[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM sports_facilities');
    return rows as Facility[];
};

export const createFacility = async (facility: Facility): Promise<number> => {
    const { name, type, capacity, location_description } = facility;
    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_facilities (name, type, capacity, location_description) VALUES (?, ?, ?, ?)',
        [name, type, capacity, location_description]
    );
    return result.insertId;
};

export const deleteFacility = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM sports_facilities WHERE id = ?', [id]);
};

// Booking Management
export const createBooking = async (booking: Booking): Promise<number> => {
    const { facility_id, booked_by_id, start_time, end_time, purpose, status } = booking;

    // Check for conflicts
    const [conflicts] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM sports_bookings 
         WHERE facility_id = ? 
         AND status != 'Rejected'
         AND (
           (start_time <= ? AND end_time > ?) OR
           (start_time < ? AND end_time >= ?) OR
           (start_time >= ? AND end_time <= ?)
         )`,
        [facility_id, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (conflicts.length > 0) {
        throw new Error('Facility is already booked for this time slot');
    }

    const [result] = await pool.query<OkPacket>(
        'INSERT INTO sports_bookings (facility_id, booked_by_id, start_time, end_time, purpose, status) VALUES (?, ?, ?, ?, ?, ?)',
        [facility_id, booked_by_id, start_time, end_time, purpose, status || 'Pending']
    );
    return result.insertId;
};

export const getBookings = async (facilityId?: number, userId?: number): Promise<Booking[]> => {
    let query = 'SELECT * FROM sports_bookings WHERE 1=1';
    const params: any[] = [];

    if (facilityId) {
        query += ' AND facility_id = ?';
        params.push(facilityId);
    }

    if (userId) {
        query += ' AND booked_by_id = ?';
        params.push(userId);
    }

    query += ' ORDER BY start_time DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Booking[];
};

export const updateBookingStatus = async (id: number, status: 'Approved' | 'Rejected'): Promise<void> => {
    await pool.query(
        'UPDATE sports_bookings SET status = ? WHERE id = ?',
        [status, id]
    );
};

export const deleteBooking = async (id: number): Promise<void> => {
    await pool.query('DELETE FROM sports_bookings WHERE id = ?', [id]);
};
