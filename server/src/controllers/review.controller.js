/**
 * Review Controller
 * Handles movie reviews and ratings
 */

import Review from '../models/review.model.js';
import Movie from '../models/movie.model.js';
import User from '../models/users.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Create review for a movie
// @route   POST /api/review/movie/:movieId
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const { rating, title, comment } = req.body;

  console.log('Create review - User:', req.user._id, 'Movie:', movieId);

  // Validation
  if (!rating) {
    res.status(400);
    throw new Error('Rating is required');
  }

  if (rating < 1 || rating > 10) {
    res.status(400);
    throw new Error('Rating must be between 1 and 10');
  }

  // Check movie exists
  const movie = await Movie.findById(movieId);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  console.log('Movie found:', movie.title);

  // Check if user already reviewed
  const existingReview = await Review.findOne({
    user: req.user._id,
    movie: movieId
  });

  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this movie');
  }

  // Create review
  const review = await Review.create({
    user: req.user._id,
    movie: movieId,
    rating,
    title: title || '',
    comment: comment || ''
  });

  console.log('Review created:', review._id);

  // Update user stats (with safe fallback)
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Check if stats field exists
      if (!user.stats) {
        user.stats = {
          total_watched: 0,
          total_reviews: 0,
          watch_time_minutes: 0
        };
      }
      
      // Increment review count
      if (typeof user.stats.total_reviews === 'number') {
        user.stats.total_reviews += 1;
      } else {
        user.stats.total_reviews = 1;
      }
      
      await user.save();
      console.log('User stats updated');
    }
  } catch (error) {
    // Don't fail the request if stats update fails
    console.error('Failed to update user stats:', error.message);
  }

  // Update movie stats
  try {
    await Movie.findByIdAndUpdate(movieId, {
      $inc: { review_count: 1 }
    });
  } catch (error) {
    console.error('Failed to update movie stats:', error.message);
  }

  // Populate user details
  await review.populate('user', 'username avatar');

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

// @desc    Get reviews for a movie
// @route   GET /api/review/movie/:movieId
// @access  Public
export const getMovieReviews = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || '-createdAt'; // newest, oldest, highest, lowest, helpful

  const skip = (page - 1) * limit;

  // Map sort options
  let sortOption = {};
  switch (sort) {
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    case 'highest':
      sortOption = { rating: -1 };
      break;
    case 'lowest':
      sortOption = { rating: 1 };
      break;
    case 'helpful':
      sortOption = { helpful_count: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  // Get reviews
  const reviews = await Review.find({ movie: movieId })
    .populate('user', 'username avatar')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ movie: movieId });

  // Get rating distribution
  const stats = await Review.aggregate([
    { $match: { movie: movieId } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    }
  ]);

  const ratingDistribution = {};
  for (let i = 1; i <= 10; i++) {
    ratingDistribution[i] = 0;
  }
  stats.forEach(stat => {
    ratingDistribution[stat._id] = stat.count;
  });

  // Calculate average rating
  const avgResult = await Review.aggregate([
    { $match: { movie: movieId } },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' }
      }
    }
  ]);

  const averageRating = avgResult.length > 0 ? avgResult[0].average : 0;

  res.json({
    success: true,
    data: {
      reviews,
      stats: {
        total_reviews: total,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: ratingDistribution
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Update review
// @route   PUT /api/review/:reviewId
// @access  Private
export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, title, comment } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check ownership
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }

  // Update fields
  if (rating !== undefined) {
    if (rating < 1 || rating > 10) {
      res.status(400);
      throw new Error('Rating must be between 1 and 10');
    }
    review.rating = rating;
  }

  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  await review.populate('user', 'username avatar');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/review/:reviewId
// @access  Private
export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check ownership or admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  await review.deleteOne();

  // Update user stats
  try {
    const user = await User.findById(review.user);
    if (user && user.stats && typeof user.stats.total_reviews === 'number') {
      user.stats.total_reviews = Math.max(0, user.stats.total_reviews - 1);
      await user.save();
    }
  } catch (error) {
    console.error('Failed to update user stats:', error.message);
  }

  // Update movie stats
  try {
    await Movie.findByIdAndUpdate(review.movie, {
      $inc: { review_count: -1 }
    });
  } catch (error) {
    console.error('Failed to update movie stats:', error.message);
  }

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Toggle helpful on review
// @route   POST /api/review/:reviewId/helpful
// @access  Private
export const toggleHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user already marked as helpful
  const alreadyHelpful = review.helpful_by.includes(req.user._id);

  if (alreadyHelpful) {
    // Remove from helpful
    review.helpful_by = review.helpful_by.filter(
      id => id.toString() !== req.user._id.toString()
    );
    review.helpful_count -= 1;
  } else {
    // Add to helpful
    review.helpful_by.push(req.user._id);
    review.helpful_count += 1;
  }

  await review.save();

  res.json({
    success: true,
    message: alreadyHelpful ? 'Removed helpful mark' : 'Marked as helpful',
    data: {
      helpful_count: review.helpful_count,
      is_helpful: !alreadyHelpful
    }
  });
});

// @desc    Get user's reviews
// @route   GET /api/review/me/all
// @access  Private
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('movie', 'title poster_path')
    .sort('-createdAt');

  res.json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Check if user reviewed a movie
// @route   GET /api/review/movie/:movieId/check
// @access  Private
export const checkUserReview = asyncHandler(async (req, res) => {
  const { movieId } = req.params;

  const review = await Review.findOne({
    user: req.user._id,
    movie: movieId
  });

  res.json({
    success: true,
    has_reviewed: !!review,
    review: review || null
  });
});

// Route: GET /api/review/all
// Controller: reviewController.js

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username')
      .populate('movie', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};