import Movie from '../models/movie.model.js';
import ViewHistory from '../models/viewhistory.model.js';
import Review from '../models/review.model.js';

// Get recommendations for user
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's watch history
    const watchHistory = await ViewHistory.find({ user: userId })
      .populate('movie', 'genres')
      .sort('-createdAt')
      .limit(20);

    // Get user's reviews
    const userReviews = await Review.find({ user: userId })
      .populate('movie', 'genres')
      .sort('-createdAt');

    // Extract genres from watched movies
    const watchedGenres = {};
    const watchedMovieIds = [];

    watchHistory.forEach(item => {
      if (item.movie?.genres) {
        watchedMovieIds.push(item.movie._id);
        item.movie.genres.forEach(genre => {
          watchedGenres[genre] = (watchedGenres[genre] || 0) + 1;
        });
      }
    });

    // Extract genres from highly rated reviews (rating >= 7)
    userReviews.forEach(review => {
      if (review.rating >= 7 && review.movie?.genres) {
        review.movie.genres.forEach(genre => {
          watchedGenres[genre] = (watchedGenres[genre] || 0) + 2; // Weight higher
        });
      }
    });

    // Get top 3 favorite genres
    const favoriteGenres = Object.entries(watchedGenres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    // Build recommendations
    let forYou = [];
    let similarToWatched = [];
    let trending = [];

    // 1. FOR YOU - Based on favorite genres
    if (favoriteGenres.length > 0) {
      forYou = await Movie.find({
        genres: { $in: favoriteGenres },
        _id: { $nin: watchedMovieIds }
      })
        .sort('-rating -popularity')
        .limit(12);
    }

    // If not enough, add popular movies
    if (forYou.length < 12) {
      const additional = await Movie.find({
        _id: { $nin: [...watchedMovieIds, ...forYou.map(m => m._id)] }
      })
        .sort('-popularity -rating')
        .limit(12 - forYou.length);
      
      forYou = [...forYou, ...additional];
    }

    // 2. SIMILAR TO WATCHED - Based on last watched movie
    if (watchHistory.length > 0 && watchHistory[0].movie?.genres) {
      const lastWatchedGenres = watchHistory[0].movie.genres;
      
      similarToWatched = await Movie.find({
        genres: { $in: lastWatchedGenres },
        _id: { $nin: [...watchedMovieIds, ...forYou.map(m => m._id)] }
      })
        .sort('-rating')
        .limit(10);
    }

    // 3. TRENDING - Popular movies not watched
    trending = await Movie.find({
      _id: { $nin: [...watchedMovieIds, ...forYou.map(m => m._id), ...similarToWatched.map(m => m._id)] }
    })
      .sort('-view_count -popularity')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        forYou,
        similarToWatched,
        trending,
        favoriteGenres
      }
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
};

// Get recommendations for non-logged users
export const getPublicRecommendations = async (req, res) => {
  try {
    // Just return popular and trending movies
    const popular = await Movie.find()
      .sort('-rating -popularity')
      .limit(12);

    const trending = await Movie.find()
      .sort('-view_count -popularity')
      .limit(10);

    const newReleases = await Movie.find()
      .sort('-release_year -createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        forYou: popular,
        trending,
        similarToWatched: newReleases
      }
    });

  } catch (error) {
    console.error('Error getting public recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
};