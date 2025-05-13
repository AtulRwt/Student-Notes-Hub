import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBook, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaUser, FaBars, FaTimes, FaUserFriends, FaNetworkWired } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import NotificationsButton from './NotificationsButton';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-dark-accent/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FaBook className="h-6 w-6 mr-2 text-blue-400" />
              <span className="gradient-text font-bold text-xl">Student Notes Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/notes"
                className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors"
              >
                Browse Notes
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/notes/create"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors"
                  >
                    Upload Note
                  </Link>
                  <Link
                    to="/network"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors flex items-center"
                  >
                    <FaUserFriends className="mr-1 text-blue-400" /> Network
                  </Link>
                  <Link
                    to="/connections"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors flex items-center"
                  >
                    <FaNetworkWired className="mr-1 text-purple-400" /> Connections
                  </Link>
                  <div className="relative ml-3 flex items-center">
                    <NotificationsButton />
                    <Link
                      to="/profile"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors flex items-center"
                    >
                      <FaUser className="mr-1 text-blue-400" /> {user?.name}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="ml-2 px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors flex items-center"
                    >
                      <FaSignOutAlt className="mr-1 text-blue-400" /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors flex items-center"
                  >
                    <FaSignInAlt className="mr-1 text-blue-400" /> Login
                  </Link>
                  <Link
                    to="/register"
                    className="gradient-border px-3 py-2 rounded-md text-sm font-medium bg-dark hover:bg-dark-light transition-all flex items-center"
                  >
                    <FaUserPlus className="mr-1 text-blue-400" /> Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-light hover:text-blue-400 transition-colors"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-light rounded-b-lg mx-4 mb-4 animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/notes"
              className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Notes
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/notes/create"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Upload Note
                </Link>
                <Link
                  to="/network"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUserFriends className="mr-1 text-blue-400" /> Network
                </Link>
                <Link
                  to="/connections"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaNetworkWired className="mr-1 text-purple-400" /> Connections
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUser className="mr-1 text-blue-400" /> Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                >
                  <FaSignOutAlt className="mr-1 text-blue-400" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaSignInAlt className="mr-1 text-blue-400" /> Login
                </Link>
                <Link
                  to="/register"
                  className="gradient-border block px-3 py-2 rounded-md text-base font-medium bg-dark hover:bg-dark-light transition-all flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUserPlus className="mr-1 text-blue-400" /> Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 