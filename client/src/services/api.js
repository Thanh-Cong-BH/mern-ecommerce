import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Movie API
export const movieAPI = {
  getAll: (params) => api.get('/movie', { params }),
  getById: (id) => api.get(`/movie/${id}`),
  getTrending: () => api.get('/movie/trending'),
  getFeatured: () => api.get('/movie/featured'),
  search: (query) => api.get('/movie', { params: { search: query } }),
  getByGenre: (genre) => api.get('/movie', { params: { genre } }),
  
  // Recommendations
  getRecommendations: () => api.get('/movie/recommendations/for-you')
};

// Watchlist API
export const watchlistAPI = {
  getAll: () => api.get('/watchlist'),
  add: (movieId, status = 'want_to_watch') => api.post('/watchlist', { 
    movie: movieId, 
    status 
  }),
  update: (id, data) => api.put(`/watchlist/${id}`, data),
  remove: (id) => api.delete(`/watchlist/${id}`),
  check: (movieId) => api.get(`/watchlist/check/${movieId}`)
};

// View History API
export const historyAPI = {
  getAll: () => api.get('/viewhistory'),
  getContinueWatching: () => api.get('/viewhistory/continue-watching'),
  record: (movieId) => api.post(`/viewhistory/${movieId}`),
  updateProgress: (movieId, progress, duration) => 
    api.put(`/viewhistory/${movieId}/progress`, { progress, duration })
};

// Review API
export const reviewAPI = {
  getByMovie: (movieId, params) => api.get(`/review/movie/${movieId}`, { params }),
  create: (movieId, data) => api.post(`/review/movie/${movieId}`, data),
  update: (reviewId, data) => api.put(`/review/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/review/${reviewId}`),
  toggleHelpful: (reviewId) => api.post(`/review/${reviewId}/helpful`),
  getMyReviews: () => api.get('/review/me/all')
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getMy: () => api.get('/subscription/me'),
  create: (plan) => api.post('/subscription', { plan }),
  cancel: () => api.put('/subscription/cancel')
};

export default api;