/**
 * Watchlist Controller
 * Handles user's watchlist operations (movies they want to watch)
 */

import Watchlist from '../models/watchlist.model.js'
import Movie from '../models/movie.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
export const getWatchlist = asyncHandler(async (req, res) => {
  const status = req.query.status; // 'want_to_watch', 'watching', 'watched'
  const sort = req.query.sort || '-createdAt'; // Default: newest first

  const watchlist = await Watchlist.getUserWatchlist(req.user._id, status)
    .sort(sort);

  res.json({
    success: true,
    count: watchlist.length,
    data: watchlist
  });
});

// @desc    Add movie to watchlist
// @route   POST /api/watchlist
// @access  Private
export const addToWatchlist = asyncHandler(async (req, res) => {
  // Accept both 'movie' and 'movie_id' for flexibility
  const movieId = req.body.movie || req.body.movie_id;
  const { note, priority, status } = req.body;

  console.log('Add to watchlist - User:', req.user._id, 'Movie:', movieId);

  // Validate movie ID provided
  if (!movieId) {
    res.status(400);
    throw new Error('Movie ID is required');
  }

  // Validate movie exists
  const movie = await Movie.findById(movieId);
  if (!movie) {
    console.log('Movie not found:', movieId);
    res.status(404);
    throw new Error('Movie not found');
  }

  console.log('Movie found:', movie.title);

  // Check if already in watchlist
  const existingItem = await Watchlist.findOne({
    user: req.user._id,
    movie: movieId
  });

  if (existingItem) {
    res.status(400);
    throw new Error('Movie already in your watchlist');
  }

  // Create watchlist item
  const watchlistItem = await Watchlist.create({
    user: req.user._id,
    movie: movieId,
    note: note || '',
    priority: priority || 3,
    status: status || 'want_to_watch'
  });

  console.log('Watchlist item created:', watchlistItem._id);

  // Populate movie details
  await watchlistItem.populate('movie');

  res.status(201).json({
    success: true,
    message: 'Movie added to watchlist',
    data: watchlistItem
  });
});

// @desc    Update watchlist item
// @route   PUT /api/watchlist/:id
// @access  Private
export const updateWatchlistItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let watchlistItem = await Watchlist.findById(id);

  if (!watchlistItem) {
    res.status(404);
    throw new Error('Watchlist item not found');
  }

  // Verify ownership
  if (watchlistItem.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this item');
  }

  // Update allowed fields
  const { note, priority, status } = req.body;
  
  if (note !== undefined) watchlistItem.note = note;
  if (priority !== undefined) watchlistItem.priority = priority;
  if (status !== undefined) watchlistItem.status = status;

  await watchlistItem.save();
  await watchlistItem.populate('movie');

  res.json({
    success: true,
    data: watchlistItem
  });
});

// @desc    Remove movie from watchlist
// @route   DELETE /api/watchlist/:id
// @access  Private
export const removeFromWatchlist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const watchlistItem = await Watchlist.findById(id);

  if (!watchlistItem) {
    res.status(404);
    throw new Error('Watchlist item not found');
  }

  // Verify ownership
  if (watchlistItem.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this item');
  }

  await watchlistItem.deleteOne();

  res.json({
    success: true,
    message: 'Movie removed from watchlist'
  });
});

// @desc    Check if movie is in watchlist
// @route   GET /api/watchlist/check/:movieId
// @access  Private
export const checkInWatchlist = asyncHandler(async (req, res) => {
  const { movieId } = req.params;

  const item = await Watchlist.findOne({
    user: req.user._id,
    movie: movieId
  });

  res.json({
    success: true,
    in_watchlist: !!item,
    item: item || null
  });
});

// @desc    Get watchlist statistics
// @route   GET /api/watchlist/stats
// @access  Private
export const getWatchlistStats = asyncHandler(async (req, res) => {
  const stats = await Watchlist.aggregate([
    {
      $match: { user: req.user._id }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await Watchlist.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: {
      total,
      by_status: stats
    }
  });
});
