import express from 'express';
import * as activityController from '../controllers/sportActivityController';

const router = express.Router();

router.get('/activities', activityController.getActivities);
router.post('/activities', activityController.createActivity);
router.delete('/activities/:id', activityController.deleteActivity);

export default router;
