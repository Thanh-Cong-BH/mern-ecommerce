import express from 'express';
import { protect } from '../middlewares/jwt-auth.js';
import * as viewHistoryController from '../controllers/viewhistory.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all view history for current user
router.get('/', viewHistoryController.getAllHistory);

// Get continue watching (with progress)
router.get('/continue-watching', viewHistoryController.getContinueWatching);

// Get stats (for admin - optional)
router.get('/stats', viewHistoryController.getStats);

// Record a view (when user clicks Watch)
router.post('/:movieId', viewHistoryController.recordView);

// Update progress (while watching)
router.put('/:movieId/progress', viewHistoryController.updateProgress);

export default router;