import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalViews: 0
  });
  const [recentMovies, setRecentMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all stats in parallel
      const [moviesRes, usersRes, reviewsRes, historyRes] = await Promise.allSettled([
        // Movies count
        axios.get('http://localhost:3001/api/movie', { headers }),
        
        // Users count (if you have this endpoint, otherwise skip)
        axios.get('http://localhost:3001/api/users', { headers }).catch(() => null),
        
        // Reviews count (if you have this endpoint, otherwise skip)
        axios.get('http://localhost:3001/api/review/all', { headers }).catch(() => null),
        
        // View history count
        axios.get('http://localhost:3001/api/viewHistory/stats', { headers }).catch(() => null),
      ]);

      // Parse movies
      let totalMovies = 0;
      if (moviesRes.status === 'fulfilled') {
        const data = moviesRes.value.data;
        totalMovies = data.pagination?.total || data.total || (Array.isArray(data.data) ? data.data.length : 0);
      }

      // Parse users
      let totalUsers = 0;
      if (usersRes.status === 'fulfilled' && usersRes.value) {
        totalUsers = usersRes.value.data?.data?.length || usersRes.value.data?.length || 0;
      }

      // Parse reviews
      let totalReviews = 0;
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value) {
        totalReviews = reviewsRes.value.data?.data?.length || reviewsRes.value.data?.length || 0;
      }

      // Parse views
      let totalViews = 0;
      if (historyRes.status === 'fulfilled' && historyRes.value) {
        const stats = historyRes.value.data?.data || historyRes.value.data;
        totalViews = stats?.total_views || 0;
      }

      setStats({
        totalMovies,
        totalUsers,
        totalReviews,
        totalViews
      });

      // Fetch recent movies
      const recentRes = await axios.get('http://localhost:3001/api/movie?limit=5&sort=-createdAt', { headers });
      const movies = Array.isArray(recentRes.data.data) ? recentRes.data.data : [];
      setRecentMovies(movies);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your movie streaming platform</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link to="/admin/movies/new" className="card p-6 hover:bg-dark-lighter transition">
            <div className="text-primary text-3xl mb-2">➕</div>
            <h3 className="text-white font-semibold">Add Movie</h3>
            <p className="text-gray-400 text-sm">Upload new content</p>
          </Link>
          <Link to="/admin/movies" className="card p-6 hover:bg-dark-lighter transition">
            <div className="text-primary text-3xl mb-2">🎬</div>
            <h3 className="text-white font-semibold">Manage Movies</h3>
            <p className="text-gray-400 text-sm">Edit or delete movies</p>
          </Link>
          <Link to="/admin/users" className="card p-6 hover:bg-dark-lighter transition">
            <div className="text-primary text-3xl mb-2">👥</div>
            <h3 className="text-white font-semibold">Manage Users</h3>
            <p className="text-gray-400 text-sm">View user accounts</p>
          </Link>
          <Link to="/admin/reviews" className="card p-6 hover:bg-dark-lighter transition">
            <div className="text-primary text-3xl mb-2">⭐</div>
            <h3 className="text-white font-semibold">Reviews</h3>
            <p className="text-gray-400 text-sm">Moderate reviews</p>
          </Link>
        </div>

        {/* Stats Cards - REAL DATA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Total Movies</p>
            <p className="text-4xl font-bold text-primary">{stats.totalMovies.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-2">In database</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Total Users</p>
            <p className="text-4xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-2">Registered accounts</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Total Reviews</p>
            <p className="text-4xl font-bold text-primary">{stats.totalReviews.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-2">User reviews</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-400 mb-2">Total Views</p>
            <p className="text-4xl font-bold text-primary">{stats.totalViews.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-2">All time views</p>
          </div>
        </div>

        {/* Recent Movies */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Recent Movies</h2>
            <Link to="/admin/movies" className="text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 py-3">Title</th>
                  <th className="text-left text-gray-400 py-3">Year</th>
                  <th className="text-left text-gray-400 py-3">Rating</th>
                  <th className="text-left text-gray-400 py-3">Views</th>
                  <th className="text-left text-gray-400 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentMovies.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No recent movies
                    </td>
                  </tr>
                ) : (
                  recentMovies.map((movie) => (
                    <tr key={movie._id} className="border-b border-gray-800">
                      <td className="py-4 text-white">{movie.title}</td>
                      <td className="py-4 text-gray-400">{movie.release_year}</td>
                      <td className="py-4 text-gray-400">⭐ {movie.rating?.toFixed(1) || 'N/A'}</td>
                      <td className="py-4 text-gray-400">{movie.view_count || 0}</td>
                      <td className="py-4">
                        <Link
                          to={`/admin/movies/edit/${movie._id}`}
                          className="text-primary hover:underline mr-4"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/movie/${movie._id}`}
                          className="text-gray-400 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;