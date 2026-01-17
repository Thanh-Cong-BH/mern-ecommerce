import ViewHistory from '../models/viewhistory.model.js';
import Movie from '../models/movie.model.js';

// Record a view when user clicks "Watch"
export const recordView = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    // Check if view already exists
    let viewRecord = await ViewHistory.findOne({
      user: userId,
      movie: movieId
    });

    if (viewRecord) {
      // Update last watched time
      viewRecord.last_watched = new Date();
      await viewRecord.save();
    } else {
      // Create new view record
      viewRecord = await ViewHistory.create({
        user: userId,
        movie: movieId,
        progress: 0,
        last_watched: new Date()
      });

      // Increment movie view count
      await Movie.findByIdAndUpdate(movieId, {
        $inc: { view_count: 1 }
      });
    }

    res.status(200).json({
      success: true,
      message: 'View recorded',
      data: viewRecord
    });

  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record view'
    });
  }
};

// Update progress
export const updateProgress = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { progress, duration } = req.body;
    const userId = req.user._id;

    const viewRecord = await ViewHistory.findOneAndUpdate(
      { user: userId, movie: movieId },
      {
        progress: progress,
        duration: duration,
        last_watched: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Progress updated',
      data: viewRecord
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
};

// Get continue watching (movies with progress)
export const getContinueWatching = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await ViewHistory.find({ user: userId })
      .populate('movie')
      .sort('-last_watched')
      .limit(20);

    res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting continue watching:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get continue watching'
    });
  }
};

// Get all view history
export const getAllHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await ViewHistory.find({ user: userId })
      .populate('movie')
      .sort('-last_watched');

    res.status(200).json({
      success: true,
      data: history,
      count: history.length
    });

  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history'
    });
  }
};

// Get stats (for admin)
export const getStats = async (req, res) => {
  try {
    const totalViews = await ViewHistory.countDocuments();
    const uniqueMovies = await ViewHistory.distinct('movie');
    const uniqueUsers = await ViewHistory.distinct('user');

    res.status(200).json({
      success: true,
      data: {
        total_views: totalViews,
        unique_movies: uniqueMovies.length,
        unique_users: uniqueUsers.length
      }
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
};