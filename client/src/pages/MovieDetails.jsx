import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { movieAPI, reviewAPI, watchlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    fetchMovieDetails();
    fetchReviews();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await movieAPI.getById(id);
      setMovie(response.data || response);
    } catch (error) {
      console.error('Error fetching movie:', error);
      setError('Movie not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getByMovie(id);
      setReviews(response.data?.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await watchlistAPI.add(id);
      alert('Added to watchlist!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await reviewAPI.create(id, reviewData);
      alert('Review submitted!');
      setShowReviewForm(false);
      setReviewData({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || 'Movie not found'}</p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <div
        className="relative h-[60vh] bg-cover bg-center"
        style={{
          backgroundImage: `url(${movie.backdrop_path || movie.poster_path || 'https://via.placeholder.com/1920x1080'})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="container-custom -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={movie.poster_path || 'https://via.placeholder.com/300x450'}
              alt={movie.title}
              className="w-64 rounded-lg shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 text-xl">⭐</span>
                <span className="text-white font-semibold text-lg">
                  {movie.rating?.toFixed(1) || 'N/A'}
                </span>
              </div>
              <span className="text-gray-300">{movie.release_year}</span>
              <span className="text-gray-300">{movie.runtime} min</span>
              {movie.age_rating && (
                <span className="px-2 py-1 border border-gray-500 text-gray-300 text-sm">
                  {movie.age_rating}
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-dark-light rounded-full text-gray-300 text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              {movie.overview}
            </p>

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">Cast:</h3>
                <p className="text-gray-400">
                  {movie.cast.slice(0, 5).map(c => c.name).join(', ')}
                </p>
              </div>
            )}

            {/* Director */}
            {movie.director && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">Director:</h3>
                <p className="text-gray-400">{movie.director}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Link to={`/watch/${movie._id}`} className="btn-primary">
                ▶ Watch Now
              </Link>
              <button onClick={handleAddToWatchlist} className="btn-secondary">
                + Add to Watchlist
              </button>
              {movie.trailer_url && (
                <a
                  href={movie.trailer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  🎬 Trailer
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Reviews</h2>
            {isAuthenticated && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="card p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Write Your Review</h3>
              
              <div className="mb-4">
                <label className="label">Rating (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={reviewData.rating}
                  onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                  className="input"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="label">Title</label>
                <input
                  type="text"
                  value={reviewData.title}
                  onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                  className="input"
                  placeholder="Sum up your review in one line"
                />
              </div>

              <div className="mb-4">
                <label className="label">Comment</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  className="input min-h-32"
                  placeholder="Share your thoughts about this movie..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="card p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-semibold">{review.user?.username || 'Anonymous'}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-white font-semibold">{review.rating}/10</span>
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="text-white font-semibold mb-2">{review.title}</h4>
                  )}
                  <p className="text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;