/**
 * Watchlist Routes
 * Defines all watchlist-related API endpoints
 */

import express from 'express';
const router = express.Router();
import {
  getWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
  checkInWatchlist,
  getWatchlistStats
} from '../controllers/watchlist.controller.js';

import { protect } from '../middlewares/jwt-auth.js';

// All watchlist routes require authentication
router.use(protect);

router.get('/', getWatchlist);                          // GET /api/watchlist
router.post('/', addToWatchlist);                       // POST /api/watchlist
router.get('/stats', getWatchlistStats);                // GET /api/watchlist/stats
router.get('/check/:movieId', checkInWatchlist);        // GET /api/watchlist/check/:movieId
router.put('/:id', updateWatchlistItem);                // PUT /api/watchlist/:id
router.delete('/:id', removeFromWatchlist);             // DELETE /api/watchlist/:id

export default router;