import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { historyAPI, reviewAPI, subscriptionAPI, watchlistAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const [continueWatching, setContinueWatching] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState({
    moviesWatched: 0,
    reviewsWritten: 0,
    watchlistCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...');

      // Fetch all data
      const [continueRes, reviewsRes, watchlistRes] = await Promise.all([
        historyAPI.getContinueWatching().catch(err => {
          console.error('Error fetching history:', err);
          return { data: [] };
        }),
        reviewAPI.getMyReviews().catch(err => {
          console.error('Error fetching reviews:', err);
          return { data: [] };
        }),
        watchlistAPI.getAll().catch(err => {
          console.error('Error fetching watchlist:', err);
          return { data: [] };
        })
      ]);

      console.log('Continue watching response:', continueRes);
      console.log('Reviews response:', reviewsRes);
      console.log('Watchlist response:', watchlistRes);

      // Parse continue watching
      let continueData = [];
      if (Array.isArray(continueRes.data)) {
        continueData = continueRes.data;
      } else if (Array.isArray(continueRes)) {
        continueData = continueRes;
      }
      console.log('Continue watching data:', continueData);
      setContinueWatching(continueData);

      // Parse reviews
      let reviewsData = [];
      if (Array.isArray(reviewsRes.data)) {
        reviewsData = reviewsRes.data;
      } else if (Array.isArray(reviewsRes)) {
        reviewsData = reviewsRes;
      }
      console.log('Reviews data:', reviewsData);
      setMyReviews(reviewsData);

      // Parse watchlist
      let watchlistData = [];
      if (Array.isArray(watchlistRes.data)) {
        watchlistData = watchlistRes.data;
      } else if (Array.isArray(watchlistRes)) {
        watchlistData = watchlistRes;
      }
      console.log('Watchlist data:', watchlistData);

      // Calculate stats
      const calculatedStats = {
        moviesWatched: continueData.length,
        reviewsWritten: reviewsData.length,
        watchlistCount: watchlistData.length
      };
      console.log('Calculated stats:', calculatedStats);
      setStats(calculatedStats);

      // Try to get subscription
      try {
        const subRes = await subscriptionAPI.getMy();
        setSubscription(subRes.data);
      } catch (error) {
        console.log('No subscription found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
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
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-3xl font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user?.username}</h1>
              <p className="text-gray-400">{user?.email}</p>
              {user?.role && (
                <span className="inline-block px-3 py-1 bg-primary text-white text-sm rounded mt-2">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-700">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'reviews', label: 'My Reviews' },
            { value: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 border-b-2 transition ${
                activeTab === tab.value
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Debug Info */}
            <div className="card p-4 bg-blue-500/10 border border-blue-500">
              <h3 className="text-blue-400 font-semibold mb-2">🔍 Debug Info:</h3>
              <p className="text-gray-300 text-sm">History items: {continueWatching.length}</p>
              <p className="text-gray-300 text-sm">Reviews: {myReviews.length}</p>
              <p className="text-gray-300 text-sm">Check browser console (F12) for detailed logs</p>
            </div>

            {/* Subscription Info */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Subscription</h2>
              {subscription ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-lg text-white font-semibold capitalize">
                        {subscription.plan} Plan
                      </p>
                      <p className="text-gray-400">
                        {subscription.status === 'active' ? (
                          <span className="text-green-500">Active</span>
                        ) : (
                          <span className="text-red-500">Expired</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Expires on</p>
                      <p className="text-white">
                        {new Date(subscription.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 mb-4">You don't have an active subscription</p>
                </div>
              )}
            </div>

            {/* Continue Watching */}
            {continueWatching.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Continue Watching</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {continueWatching.slice(0, 4).map((item) => (
                    <Link
                      key={item._id}
                      to={`/watch/${item.movie._id}`}
                      className="group"
                    >
                      <div className="relative">
                        <img
                          src={item.movie.poster_path || 'https://via.placeholder.com/300x450'}
                          alt={item.movie.title}
                          className="w-full rounded-lg"
                        />
                        {item.progress && item.movie.runtime && (
                          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700 rounded-b-lg overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ 
                                width: `${Math.min((item.progress / (item.movie.runtime * 60)) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <h3 className="text-white mt-2 group-hover:text-primary">
                        {item.movie.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6 text-center">
                <p className="text-4xl font-bold text-primary mb-2">
                  {stats.moviesWatched}
                </p>
                <p className="text-gray-400">Movies Watched</p>
                <p className="text-gray-500 text-sm mt-1">Total in history</p>
              </div>
              <div className="card p-6 text-center">
                <p className="text-4xl font-bold text-primary mb-2">
                  {stats.reviewsWritten}
                </p>
                <p className="text-gray-400">Reviews Written</p>
                <p className="text-gray-500 text-sm mt-1">Your contributions</p>
              </div>
              <div className="card p-6 text-center">
                <p className="text-4xl font-bold text-primary mb-2">
                  {stats.watchlistCount}
                </p>
                <p className="text-gray-400">Watchlist Items</p>
                <p className="text-gray-500 text-sm mt-1">Movies saved</p>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">My Reviews ({myReviews.length})</h2>
            {myReviews.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl mb-4">You haven't written any reviews yet</p>
                <Link to="/browse" className="btn-primary">
                  Browse Movies
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myReviews.map((review) => (
                  <div key={review._id} className="card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Link
                        to={`/movie/${review.movie._id}`}
                        className="text-xl font-semibold text-white hover:text-primary"
                      >
                        {review.movie.title}
                      </Link>
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-white font-semibold">{review.rating}/10</span>
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="text-white font-semibold mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-300 mb-3">{review.comment}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
            
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Username</label>
                    <p className="text-white">{user?.username}</p>
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <p className="text-white">{user?.email}</p>
                  </div>
                  <div>
                    <label className="label">Full Name</label>
                    <p className="text-white">{user?.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="label">Member Since</label>
                    <p className="text-white">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;