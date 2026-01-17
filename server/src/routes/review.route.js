/**
 * Review Routes
 * Handles movie reviews and ratings
 */

import express from 'express';
const router = express.Router();

import {
  createReview,
  getMovieReviews,
  updateReview,
  deleteReview,
  toggleHelpful,
  getMyReviews,
  checkUserReview,
  getAllReviews
} from '../controllers/review.controller.js';

import { protect, admin } from '../middlewares/jwt-auth.js';

// ============================================
// PUBLIC ROUTES
// ============================================

// Get reviews for a movie
router.get('/movie/:movieId', getMovieReviews);           // GET /api/review/movie/:movieId

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================

router.use(protect);

// Create review
router.post('/movie/:movieId', createReview);             // POST /api/review/movie/:movieId

// Check if user reviewed a movie
router.get('/movie/:movieId/check', checkUserReview);     // GET /api/review/movie/:movieId/check

// Get my reviews
router.get('/me/all', getMyReviews);                      // GET /api/review/me/all

// Update review
router.put('/:reviewId', updateReview);                   // PUT /api/review/:reviewId

// Delete review (owner or admin)
router.delete('/:reviewId', deleteReview);                // DELETE /api/review/:reviewId

// Toggle helpful
router.post('/:reviewId/helpful', toggleHelpful);         // POST /api/review/:reviewId/helpful

// Add to existing reviewRoutes.js
router.get('/all', admin, getAllReviews);

export default router;