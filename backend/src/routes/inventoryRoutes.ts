import express from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Inventory Item Management
router.get('/', authenticate, inventoryController.getInventory);
router.get('/:id', authenticate, inventoryController.getInventoryItem);
router.post('/', authenticate, authorize(['Admin', 'Coach']), inventoryController.createInventoryItem);
router.put('/:id', authenticate, authorize(['Admin', 'Coach']), inventoryController.updateInventoryItem);
router.delete('/:id', authenticate, authorize(['Admin']), inventoryController.deleteInventoryItem);

// Borrowing/Returning
router.post('/borrow', authenticate, inventoryController.borrowItem);
router.put('/return/:logId', authenticate, inventoryController.returnItem);
router.get('/history', authenticate, inventoryController.getBorrowingHistory);

export default router;
