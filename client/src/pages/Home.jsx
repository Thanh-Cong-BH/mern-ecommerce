import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieAPI } from '../services/api';
import MovieRow from '../components/Movie/MovieRow';

const Home = () => {
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      // Fetch all movies
      const response = await movieAPI.getAll({ limit: 20, sort: '-popularity' });
      
      // Your backend returns: { data: [...] }
      const movies = Array.isArray(response.data) ? response.data : [];

      if (movies.length > 0) {
        setFeatured(movies[0]);
        setTrending(movies.slice(0, 10));
        setPopular(movies.slice(5, 15));
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to load movies. Please try again later.');
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button onClick={fetchMovies} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {featured && (
        <div
          className="relative h-[70vh] bg-cover bg-center"
          style={{
            backgroundImage: `url(${featured.backdrop_path || featured.poster_path || 'https://via.placeholder.com/1920x1080'})`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-shadow">
              {featured.title}
            </h1>
            <p className="text-lg mb-6 text-shadow line-clamp-3">
              {featured.overview}
            </p>
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⭐</span>
                <span className="text-white font-semibold">{featured.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <span className="text-gray-300">{featured.release_year}</span>
              <span className="text-gray-300">{featured.runtime} min</span>
            </div>
            <div className="flex space-x-4">
              <Link to={`/watch/${featured._id}`} className="btn-primary">
                ▶ Play Now
              </Link>
              <Link to={`/movie/${featured._id}`} className="btn-outline">
                More Info
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Movie Rows */}
      <div className="container-custom py-8">
        {trending.length > 0 && <MovieRow title="Trending Now" movies={trending} />}
        {popular.length > 0 && <MovieRow title="Popular Movies" movies={popular} />}
        
        {trending.length === 0 && popular.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No movies available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;