import { useState, useEffect } from 'react';
import { watchlistAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, want_to_watch, watching, watched

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await watchlistAPI.getAll();
      setWatchlist(response.data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove from watchlist?')) return;

    try {
      await watchlistAPI.remove(id);
      setWatchlist(watchlist.filter(item => item._id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await watchlistAPI.update(id, { status });
      setWatchlist(watchlist.map(item => 
        item._id === id ? { ...item, status } : item
      ));
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredWatchlist = filter === 'all'
    ? watchlist
    : watchlist.filter(item => item.status === filter);

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
        <h1 className="text-4xl font-bold text-white mb-8">My Watchlist</h1>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-700">
          {[
            { value: 'all', label: 'All' },
            { value: 'want_to_watch', label: 'Want to Watch' },
            { value: 'watching', label: 'Watching' },
            { value: 'watched', label: 'Watched' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 border-b-2 transition ${
                filter === tab.value
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.value === 'all' && ` (${watchlist.length})`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Watchlist Items */}
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl mb-4">
              {filter === 'all' 
                ? 'Your watchlist is empty'
                : `No movies in "${filter.replace('_', ' ')}" status`
              }
            </p>
            <Link to="/browse" className="btn-primary">
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWatchlist.map((item) => (
              <div key={item._id} className="card flex flex-col md:flex-row gap-4 p-4">
                {/* Poster */}
                <Link to={`/movie/${item.movie._id}`} className="flex-shrink-0">
                  <img
                    src={item.movie.poster_path || 'https://via.placeholder.com/150x225'}
                    alt={item.movie.title}
                    className="w-32 h-48 object-cover rounded"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1">
                  <Link to={`/movie/${item.movie._id}`}>
                    <h3 className="text-xl font-bold text-white hover:text-primary mb-2">
                      {item.movie.title}
                    </h3>
                  </Link>

                  <div className="flex items-center space-x-4 mb-3 text-gray-400 text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐</span>
                      <span>{item.movie.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <span>{item.movie.release_year}</span>
                    <span>{item.movie.runtime} min</span>
                  </div>

                  <p className="text-gray-300 mb-4 line-clamp-2">
                    {item.movie.overview}
                  </p>

                  {/* Status Selector */}
                  <div className="mb-4">
                    <label className="text-gray-400 text-sm mb-2 block">Status:</label>
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item._id, e.target.value)}
                      className="input w-auto"
                    >
                      <option value="want_to_watch">Want to Watch</option>
                      <option value="watching">Watching</option>
                      <option value="watched">Watched</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/watch/${item.movie._id}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      ▶ Watch
                    </Link>
                    <Link
                      to={`/movie/${item.movie._id}`}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="text-red-500 hover:text-red-400 text-sm px-4 py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Priority Badge */}
                {item.priority && (
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{item.priority}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;