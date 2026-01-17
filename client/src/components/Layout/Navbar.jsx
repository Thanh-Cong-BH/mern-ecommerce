import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-dark border-b border-dark-light sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl font-bold text-primary">
              MoviePlay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white hover:text-gray-300 transition">
              Home
            </Link>
            <Link to="/browse" className="text-white hover:text-gray-300 transition">
              Browse
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/recommendations" className="text-white hover:text-gray-300 transition">
                  🎯 Gợi Ý
                </Link>
                <Link to="/watchlist" className="text-white hover:text-gray-300 transition">
                  My Watchlist
                </Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-primary hover:text-primary-dark transition font-semibold">
                Admin
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md mx-8">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-dark-light border border-gray-700 rounded-md focus:outline-none focus:border-primary text-white placeholder-gray-500"
            />
          </form>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-white hover:text-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span>{user?.username}</span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-gray-300 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-gray-300 transition">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 space-y-4">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-dark-light border border-gray-700 rounded-md focus:outline-none focus:border-primary text-white"
              />
            </form>
            
            <Link to="/" className="block text-white hover:text-gray-300" onClick={() => setShowMobileMenu(false)}>
              Home
            </Link>
            <Link to="/browse" className="block text-white hover:text-gray-300" onClick={() => setShowMobileMenu(false)}>
              Browse
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/recommendations" className="block text-white hover:text-gray-300" onClick={() => setShowMobileMenu(false)}>
                  🎯 Gợi Ý Cho Bạn
                </Link>
                <Link to="/watchlist" className="block text-white hover:text-gray-300" onClick={() => setShowMobileMenu(false)}>
                  My Watchlist
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="block text-primary hover:text-primary-dark font-semibold" onClick={() => setShowMobileMenu(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/profile" className="block text-white hover:text-gray-300" onClick={() => setShowMobileMenu(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left text-white hover:text-gray-300"
                >
                  Logout
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="block text-white hover:text-gray-300" onClick={() => setShowMobileMenu(false)}>
                  Login
                </Link>
                <Link to="/register" className="block btn-primary text-center" onClick={() => setShowMobileMenu(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;