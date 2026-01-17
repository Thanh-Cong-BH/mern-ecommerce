import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const AddMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    original_title: '',
    overview: '',
    release_year: new Date().getFullYear(),
    runtime: 120,
    genres: '',
    director: '',
    poster_path: '',
    backdrop_path: '',
    trailer_url: '',
    video_url: '',
    age_rating: 'PG-13'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchMovie();
    }
  }, [id]);

  const fetchMovie = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3001/api/movie/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const movie = response.data.data || response.data;
      setFormData({
        title: movie.title || '',
        original_title: movie.original_title || '',
        overview: movie.overview || '',
        release_year: movie.release_year || new Date().getFullYear(),
        runtime: movie.runtime || 120,
        genres: Array.isArray(movie.genres) ? movie.genres.join(', ') : '',
        director: movie.director || '',
        poster_path: movie.poster_path || '',
        backdrop_path: movie.backdrop_path || '',
        trailer_url: movie.trailer_url || '',
        video_url: movie.video_url || '',
        age_rating: movie.age_rating || 'PG-13'
      });
    } catch (error) {
      console.error('Error fetching movie:', error);
      alert('Failed to load movie');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
        runtime: parseInt(formData.runtime),
        release_year: parseInt(formData.release_year)
      };

      if (isEdit) {
        await axios.put(`http://localhost:3001/api/movie/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Movie updated successfully!');
      } else {
        await axios.post('http://localhost:3001/api/movie', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Movie added successfully!');
      }

      navigate('/admin/movies');
    } catch (error) {
      console.error('Error saving movie:', error);
      setError(error.response?.data?.message || 'Failed to save movie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      <div className="container-custom py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            {isEdit ? 'Edit Movie' : 'Add New Movie'}
          </h1>

          <form onSubmit={handleSubmit} className="card p-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Original Title</label>
                <input
                  type="text"
                  name="original_title"
                  value={formData.original_title}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Overview *</label>
              <textarea
                name="overview"
                value={formData.overview}
                onChange={handleChange}
                className="input min-h-32"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="label">Release Year *</label>
                <input
                  type="number"
                  name="release_year"
                  value={formData.release_year}
                  onChange={handleChange}
                  className="input"
                  min="1900"
                  max="2030"
                  required
                />
              </div>

              <div>
                <label className="label">Runtime (minutes) *</label>
                <input
                  type="number"
                  name="runtime"
                  value={formData.runtime}
                  onChange={handleChange}
                  className="input"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="label">Age Rating</label>
                <select
                  name="age_rating"
                  value={formData.age_rating}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                  <option value="NC-17">NC-17</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Genres (comma separated)</label>
              <input
                type="text"
                name="genres"
                value={formData.genres}
                onChange={handleChange}
                className="input"
                placeholder="Action, Adventure, Sci-Fi"
              />
              <p className="text-gray-500 text-sm mt-1">
                Example: Action, Adventure, Sci-Fi
              </p>
            </div>

            <div>
              <label className="label">Director</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Poster URL</label>
              <input
                type="url"
                name="poster_path"
                value={formData.poster_path}
                onChange={handleChange}
                className="input"
                placeholder="https://image.tmdb.org/t/p/w500/..."
              />
            </div>

            <div>
              <label className="label">Backdrop URL</label>
              <input
                type="url"
                name="backdrop_path"
                value={formData.backdrop_path}
                onChange={handleChange}
                className="input"
                placeholder="https://image.tmdb.org/t/p/original/..."
              />
            </div>

            <div>
              <label className="label">Trailer URL (YouTube)</label>
              <input
                type="url"
                name="trailer_url"
                value={formData.trailer_url}
                onChange={handleChange}
                className="input"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="label">Video URL</label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                className="input"
                placeholder="https://cdn.example.com/movie.mp4"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : isEdit ? 'Update Movie' : 'Add Movie'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/movies')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMovie;