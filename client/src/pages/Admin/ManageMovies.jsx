import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieAPI } from '../../services/api';
import axios from 'axios';

const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const moviesPerPage = 20;

  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage]);

  const fetchMovies = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: moviesPerPage
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await movieAPI.getAll(params);
      const movieList = Array.isArray(response.data) ? response.data : [];
      const total = response.pagination?.total || response.total || 3700; // Use your total
      
      setMovies(movieList);
      setTotalMovies(total);
      setTotalPages(Math.ceil(total / moviesPerPage));
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMovies(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/movie/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Movie deleted successfully');
      fetchMovies(currentPage);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete movie');
    }
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
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-dark-light text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-lighter"
        >
          ← Previous
        </button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded ${
                currentPage === page ? 'bg-primary text-white' : 'bg-dark-light text-white hover:bg-dark-lighter'
              }`}
            >
              {page}
            </button>
          )
        ))}

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Manage Movies</h1>
            <p className="text-gray-400">Total: {totalMovies} movies</p>
          </div>
          <Link to="/admin/movies/new" className="btn-primary">
            ➕ Add New Movie
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="input flex-1 max-w-md"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  fetchMovies(1);
                }}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Page Info */}
        <div className="mb-4 text-gray-400">
          Showing {((currentPage - 1) * moviesPerPage) + 1} - {Math.min(currentPage * moviesPerPage, totalMovies)} of {totalMovies} | Page {currentPage} of {totalPages}
        </div>

        {/* Movies Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-lighter">
                <tr>
                  <th className="text-left text-gray-400 py-4 px-6">Poster</th>
                  <th className="text-left text-gray-400 py-4 px-6">Title</th>
                  <th className="text-left text-gray-400 py-4 px-6">Year</th>
                  <th className="text-left text-gray-400 py-4 px-6">Rating</th>
                  <th className="text-left text-gray-400 py-4 px-6">Views</th>
                  <th className="text-left text-gray-400 py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie._id} className="border-b border-gray-800 hover:bg-dark-lighter">
                    <td className="py-4 px-6">
                      <img
                        src={movie.poster_path || 'https://via.placeholder.com/50x75'}
                        alt={movie.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white font-semibold">{movie.title}</p>
                        <p className="text-gray-500 text-sm">{movie.original_title}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{movie.release_year}</td>
                    <td className="py-4 px-6 text-gray-400">
                      ⭐ {movie.rating?.toFixed(1) || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-gray-400">{movie.view_count || 0}</td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Link
                          to={`/movie/${movie._id}`}
                          className="text-blue-500 hover:underline"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/movies/edit/${movie._id}`}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(movie._id, movie.title)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movies.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No movies found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && <Pagination />}
      </div>
    </div>
  );
};

export default ManageMovies;