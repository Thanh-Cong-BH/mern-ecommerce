/**
 * Movie Controller
 * Handles all movie-related operations
 */

import Movie from '../models/movie.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all movies with pagination, filters, sorting
// @route   GET /api/movies
// @access  Public
export const getMovies = asyncHandler(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Filters
  const filters = { status: 'now_showing' };

  // Filter by genre
  if (req.query.genre) {
    filters.$or = [
      { tmdb_genres: req.query.genre },
      { movielens_genres: req.query.genre }
    ];
  }

  // Filter by year
  if (req.query.year) {
    filters.release_year = req.query.year;
  }

  // Filter by age rating
  if (req.query.age_rating) {
    filters.age_rating = req.query.age_rating;
  }

  // Filter by rating (min)
  if (req.query.min_rating) {
    filters.vote_average = { $gte: parseFloat(req.query.min_rating) };
  }

  // Search by title
  if (req.query.search) {
    filters.$text = { $search: req.query.search };
  }

  // Sorting
  let sort = {};
  switch (req.query.sort) {
    case 'rating':
      sort = { vote_average: -1 };
      break;
    case 'popularity':
      sort = { popularity: -1 };
      break;
    case 'newest':
      sort = { release_date: -1 };
      break;
    case 'oldest':
      sort = { release_date: 1 };
      break;
    case 'views':
      sort = { view_count: -1 };
      break;
    default:
      sort = { popularity: -1 };
  }

  // Execute query
  const movies = await Movie.find(filters)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select('-__v');

  // Get total count for pagination
  const total = await Movie.countDocuments(filters);

  res.json({
    success: true,
    data: movies,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single movie by ID or slug
// @route   GET /api/movies/:id
// @access  Public
export const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Try to find by MongoDB _id first, then by slug
  let movie = await Movie.findById(id).select('-__v');

  if (!movie) {
    movie = await Movie.findOne({ slug: id }).select('-__v');
  }

  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  res.json({
    success: true,
    data: movie
  });
});

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
export const getTrendingMovies = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const movies = await Movie.getTrendingMovies(limit);

  res.json({
    success: true,
    data: movies
  });
});

// @desc    Get featured movies
// @route   GET /api/movies/featured
// @access  Public
export const getFeaturedMovies = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const movies = await Movie.find({ 
    is_featured: true, 
    status: 'now_showing' 
  })
    .sort({ popularity: -1 })
    .limit(limit)
    .select('-__v');

  res.json({
    success: true,
    data: movies
  });
});

// @desc    Get movies by genre
// @route   GET /api/movies/genre/:genre
// @access  Public
export const getMoviesByGenre = asyncHandler(async (req, res) => {
  const { genre } = req.params;
  const limit = parseInt(req.query.limit) || 20;

  const movies = await Movie.getByGenre(genre, limit);

  res.json({
    success: true,
    data: movies,
    genre
  });
});

// @desc    Get streaming URL for a movie
// @route   GET /api/movies/:id/stream
// @access  Private (User with active subscription)
export const getStreamingUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find movie
  const movie = await Movie.findById(id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  // Check if user has active subscription (middleware should have attached req.subscription)
  if (!req.subscription || !req.subscription.isActive()) {
    res.status(403);
    throw new Error('Active subscription required to stream movies');
  }

  // Check concurrent streams limit
  if (!req.subscription.canStream()) {
    res.status(403);
    throw new Error('Maximum concurrent streams reached for your plan');
  }

  // Get user's preferred quality
  const preferredQuality = req.user.preferences?.preferred_video_quality || '720p';
  
  // Find matching quality or default
  let streamUrl = movie.video_url;
  let selectedQuality = 'auto';

  if (movie.video_quality && movie.video_quality.length > 0) {
    const qualityOption = movie.video_quality.find(q => q.quality === preferredQuality);
    if (qualityOption) {
      streamUrl = qualityOption.url;
      selectedQuality = preferredQuality;
    }
  }

  // Get subtitles
  const subtitles = movie.subtitles || [];

  res.json({
    success: true,
    data: {
      movie_id: movie._id,
      title: movie.title,
      stream_url: streamUrl,
      quality: selectedQuality,
      available_qualities: movie.video_quality || [],
      subtitles,
      duration: movie.runtime
    }
  });
});

// @desc    Increment view count
// @route   POST /api/movies/:id/view
// @access  Private (User)
export const incrementViewCount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await Movie.findById(id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  await movie.incrementViewCount();

  res.json({
    success: true,
    message: 'View count updated',
    view_count: movie.view_count
  });
});

// @desc    Create new movie
// @route   POST /api/movies
// @access  Private (Admin only)
export const createMovie = asyncHandler(async (req, res) => {
  const movieData = req.body;

  // Validate required fields
  if (!movieData.title || !movieData.overview || !movieData.director) {
    res.status(400);
    throw new Error('Please provide title, overview, and director');
  }

  const movie = await Movie.create(movieData);

  res.status(201).json({
    success: true,
    data: movie
  });
});

// @desc    Update movie
// @route   PUT /api/movies/:id
// @access  Private (Admin only)
export const updateMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let movie = await Movie.findById(id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  // Update fields
  movie = await Movie.findByIdAndUpdate(
    id,
    { ...req.body, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: movie
  });
});

// @desc    Delete movie
// @route   DELETE /api/movies/:id
// @access  Private (Admin only)
export const deleteMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await Movie.findById(id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  await movie.deleteOne();

  res.json({
    success: true,
    message: 'Movie deleted successfully'
  });
});

// @desc    Toggle featured status
// @route   PUT /api/movies/:id/featured
// @access  Private (Admin only)
export const toggleFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await Movie.findById(id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  movie.is_featured = !movie.is_featured;
  await movie.save();

  res.json({
    success: true,
    data: movie
  });
});

// @desc    Get all unique genres
// @route   GET /api/movies/genres/list
// @access  Public
export const getGenresList = asyncHandler(async (req, res) => {
  // Aggregate all genres from tmdb_genres
  const genres = await Movie.distinct('tmdb_genres', { status: 'now_showing' });

  res.json({
    success: true,
    data: genres.sort()
  });
});

// @desc    Get movies statistics (Admin)
// @route   GET /api/movies/stats
// @access  Private (Admin only)
export const getMoviesStats = asyncHandler(async (req, res) => {
  const stats = await Movie.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgRating: { $avg: '$vote_average' },
        totalViews: { $sum: '$view_count' },
        featured: {
          $sum: { $cond: ['$is_featured', 1, 0] }
        }
      }
    }
  ]);

  const byStatus = await Movie.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const byYear = await Movie.aggregate([
    {
      $group: {
        _id: '$release_year',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {},
      by_status: byStatus,
      by_year: byYear
    }
  });
});
