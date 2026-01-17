import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieAPI } from '../services/api';
import MovieCard from '../components/Movie/MovieCard';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const moviesPerPage = 20;

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
    'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War'
  ];

  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
    fetchMovies(page);
  }, [searchParams]);

  const fetchMovies = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: page,
        limit: moviesPerPage
      };
      
      const search = searchParams.get('search');
      const genre = searchParams.get('genre');

      if (search) params.search = search;
      if (genre) params.genre = genre;

      const response = await movieAPI.getAll(params);
      
      // Parse response
      const movieList = Array.isArray(response.data) ? response.data : [];
      const total = response.pagination?.total || response.total || movieList.length;
      const pages = Math.ceil(total / moviesPerPage);
      
      setMovies(movieList);
      setTotalMovies(total);
      setTotalPages(pages);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleGenreFilter = (genre) => {
    setSelectedGenre(genre);
    const params = new URLSearchParams();
    if (genre) {
      params.set('genre', genre);
    }
    params.set('page', '1');
    setSearchParams(params);
    setSearchQuery('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSearchParams({});
  };

  // Pagination component
  const Pagination = () => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          pages.push(currentPage - 1);
          pages.push(currentPage);
          pages.push(currentPage + 1);
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-dark-light text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-lighter"
        >
          ← Previous
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded ${
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'bg-dark-light text-white hover:bg-dark-lighter'
              }`}
            >
              {page}
            </button>
          )
        ))}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-dark-light text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-lighter"
        >
          Next →
        </button>
      </div>
    );
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
        {/* Search & Filters */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Browse Movies</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for movies..."
                className="input flex-1"
              />
              <button type="submit" className="btn-primary">
                Search
              </button>
              {(searchQuery || selectedGenre) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Genre Filter */}
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-3">Filter by Genre:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGenreFilter('')}
                className={`px-4 py-2 rounded-md transition ${
                  selectedGenre === '' ? 'bg-primary text-white' : 'bg-dark-light text-gray-300 hover:bg-dark-lighter'
                }`}
              >
                All
              </button>
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreFilter(genre)}
                  className={`px-4 py-2 rounded-md transition ${
                    selectedGenre === genre ? 'bg-primary text-white' : 'bg-dark-light text-gray-300 hover:bg-dark-lighter'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchParams.get('search') || searchParams.get('genre')) && (
            <div className="text-gray-400 mb-4">
              Showing results for:{' '}
              {searchParams.get('search') && (
                <span className="text-white font-semibold">"{searchParams.get('search')}"</span>
              )}
              {searchParams.get('genre') && (
                <span className="text-white font-semibold">{searchParams.get('genre')} movies</span>
              )}
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-400">
            Showing {((currentPage - 1) * moviesPerPage) + 1} - {Math.min(currentPage * moviesPerPage, totalMovies)} of {totalMovies} movies
          </p>
          <p className="text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Movies Grid */}
        {movies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No movies found</p>
            <p className="text-gray-500 mt-2">Try a different search or filter</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && <Pagination />}
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;