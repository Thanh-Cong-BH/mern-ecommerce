import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReviews, setFilteredReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = reviews.filter(review =>
        review.movie?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReviews(filtered);
    } else {
      setFilteredReviews(reviews);
    }
  }, [searchQuery, reviews]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/review/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const reviewList = response.data.data || response.data || [];
      setReviews(reviewList);
      setFilteredReviews(reviewList);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Failed to fetch reviews. Make sure you have the /api/review/all endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId, movieTitle) => {
    if (!confirm(`Delete review for "${movieTitle}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/review/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReviews(reviews.filter(r => r._id !== reviewId));
      alert('Review deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Manage Reviews</h1>
          <p className="text-gray-400">Total: {reviews.length} reviews</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by movie or username..."
            className="input max-w-md"
          />
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              No reviews found
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <Link
                        to={`/movie/${review.movie?._id}`}
                        className="text-xl font-semibold text-white hover:text-primary"
                      >
                        {review.movie?.title || 'Unknown Movie'}
                      </Link>
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-white font-semibold">{review.rating}/10</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                      <span>By: {review.user?.username || 'Unknown User'}</span>
                      <span>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{review.helpful?.length || 0} helpful</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review._id, review.movie?.title)}
                    className="text-red-500 hover:text-red-400 px-4 py-2"
                  >
                    Delete
                  </button>
                </div>

                {review.title && (
                  <h4 className="text-white font-semibold mb-2">{review.title}</h4>
                )}
                <p className="text-gray-300">{review.comment}</p>

                {/* Tags for moderation */}
                <div className="flex space-x-2 mt-4">
                  {review.rating >= 8 && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Positive
                    </span>
                  )}
                  {review.rating <= 4 && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                      Negative
                    </span>
                  )}
                  {review.comment.length > 500 && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                      Detailed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Total Reviews</p>
            <p className="text-3xl font-bold text-white">{reviews.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Avg Rating</p>
            <p className="text-3xl font-bold text-white">
              {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0'}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Positive (≥8)</p>
            <p className="text-3xl font-bold text-white">
              {reviews.filter(r => r.rating >= 8).length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Negative (≤4)</p>
            <p className="text-3xl font-bold text-white">
              {reviews.filter(r => r.rating <= 4).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageReviews;