import express from 'express';
import { protect, admin } from '../middlewares/jwt-auth.js';
import * as movieController from '../controllers/movie.controller.js';
import * as recommendationController from '../controllers/recommendation.controller.js';

const router = express.Router();

// Recommendations (must be before /:id route)
router.get('/recommendations/for-you', protect, recommendationController.getRecommendations);
router.get('/recommendations/public', recommendationController.getPublicRecommendations);

// Public routes
router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovieById);

// Admin routes
router.post('/', protect, admin, movieController.createMovie);
router.put('/:id', protect, admin, movieController.updateMovie);
router.delete('/:id', protect, admin, movieController.deleteMovie);

export default router;