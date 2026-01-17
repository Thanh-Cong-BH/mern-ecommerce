import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import MovieDetails from './pages/MovieDetails';

// Protected Pages
import Watch from './pages/Watch';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageMovies from './pages/Admin/ManageMovies';
import AddMovie from './pages/Admin/AddMovies';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageReviews from './pages/Admin/ManageReviews';

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
  }

  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/movie/:id" element={<MovieDetails />} />

              {/* Protected Routes */}
              <Route path="/watch/:id" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
              <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/movies" element={<AdminRoute><ManageMovies /></AdminRoute>} />
              <Route path="/admin/movies/new" element={<AdminRoute><AddMovie /></AdminRoute>} />
              <Route path="/admin/movies/edit/:id" element={<AdminRoute><AddMovie /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><ManageReviews /></AdminRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;