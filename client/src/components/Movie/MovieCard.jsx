import { Link } from 'react-router-dom';
import { useState } from 'react';
import { watchlistAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MovieCard = ({ movie }) => {
  const { isAuthenticated } = useAuth();
  const [showActions, setShowActions] = useState(false);

  const handleAddToWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to add to watchlist');
      return;
    }

    try {
      await watchlistAPI.add(movie._id);
      alert('Added to watchlist!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Link to={`/movie/${movie._id}`}>
      <div 
        className="movie-card group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <img
          src={movie.poster_path || 'https://via.placeholder.com/300x450?text=No+Image'}
          alt={movie.title}
          className="w-full h-auto object-cover"
        />
        
        {showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center space-y-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-white font-bold text-lg text-center px-4">
              {movie.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⭐</span>
              <span className="text-white">{movie.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <div className="flex space-x-2">
              <Link
                to={`/watch/${movie._id}`}
                className="btn-primary text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                ▶ Play
              </Link>
              <button
                onClick={handleAddToWatchlist}
                className="btn-secondary text-sm"
              >
                + Watchlist
              </button>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default MovieCard;