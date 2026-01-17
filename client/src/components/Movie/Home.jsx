import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieAPI } from '../services/api';
import MovieRow from '../components/Movie/MovieRow';

const Home = () => {
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const [trendingRes, popularRes] = await Promise.all([
        movieAPI.getTrending(),
        movieAPI.getAll({ limit: 10, sort: '-popularity' })
      ]);

      setTrending(trendingRes.data || []);
      setPopular(popularRes.data?.movies || []);
      
      // Set first movie as featured
      if (popularRes.data?.movies?.length > 0) {
        setFeatured(popularRes.data.movies[0]);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
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
    <div className="min-h-screen">
      {/* Hero Section */}
      {featured && (
        <div
          className="relative h-[70vh] bg-cover bg-center"
          style={{
            backgroundImage: `url(${featured.backdrop_path || featured.poster_path})`
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
        <MovieRow title="Trending Now" movies={trending} />
        <MovieRow title="Popular Movies" movies={popular} />
      </div>
    </div>
  );
};

export default Home;