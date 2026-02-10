import { Response } from 'express';
import * as FacilityModel from '../models/Facility';
import { AuthRequest } from '../middleware/authMiddleware';

// Facility Management
export const getFacilities = async (req: AuthRequest, res: Response) => {
    try {
        const facilities = await FacilityModel.getAllFacilities();
        res.json(facilities);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createFacility = async (req: AuthRequest, res: Response) => {
    try {
        const facility = req.body;

        if (!facility.name || !facility.type) {
            return res.status(400).json({ error: 'name and type are required' });
        }

        const id = await FacilityModel.createFacility(facility);
        res.status(201).json({ id, ...facility });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteFacility = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await FacilityModel.deleteFacility(id);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Booking Management
export const createBooking = async (req: AuthRequest, res: Response) => {
    try {
        const booking = req.body;

        if (!booking.facility_id || !booking.booked_by_id || !booking.start_time || !booking.end_time) {
            return res.status(400).json({
                error: 'facility_id, booked_by_id, start_time, and end_time are required'
            });
        }

        const id = await FacilityModel.createBooking(booking);
        res.status(201).json({ id, ...booking });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const getBookings = async (req: AuthRequest, res: Response) => {
    try {
        const facilityId = req.query.facility_id ? parseInt(req.query.facility_id as string) : undefined;
        const userId = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;

        const bookings = await FacilityModel.getBookings(facilityId, userId);
        res.json(bookings);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const { status } = req.body;

        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'status must be Approved or Rejected' });
        }

        await FacilityModel.updateBookingStatus(id, status);
        res.json({ message: 'Booking status updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await FacilityModel.deleteBooking(id);
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
