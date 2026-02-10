import express from 'express';
import * as facilityController from '../controllers/facilityController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Facility Management
router.get('/', authenticate, facilityController.getFacilities);
router.post('/', authenticate, authorize(['Admin', 'Coach']), facilityController.createFacility);
router.delete('/:id', authenticate, authorize(['Admin']), facilityController.deleteFacility);

// Booking Management
router.get('/bookings', authenticate, facilityController.getBookings);
router.post('/bookings', authenticate, authorize(['Admin', 'Coach', 'Teacher']), facilityController.createBooking);
router.put('/bookings/:id/status', authenticate, authorize(['Admin', 'Coach']), facilityController.updateBookingStatus);
router.delete('/bookings/:id', authenticate, authorize(['Admin', 'Coach']), facilityController.deleteBooking);

export default router;
