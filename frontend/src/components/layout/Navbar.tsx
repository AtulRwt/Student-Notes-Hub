import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBook, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaUser, FaBars, FaTimes, FaUserFriends, FaNetworkWired, FaChevronDown, FaCog, FaBell, FaBookmark, FaPen, FaSlidersH, FaQuestionCircle, FaCommentAlt } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import NotificationsButton from './NotificationsButton';
import Avatar from '../shared/Avatar';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

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
                  <Link
                    to="/chat"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:text-blue-400 transition-colors flex items-center"
                  >
                    <FaCommentAlt className="mr-1 text-green-400" /> Messages
                  </Link>
                  
                  {/* Enhanced Profile Dropdown */}
                  <div className="relative ml-3" ref={profileDropdownRef}>
                    <div className="flex items-center">
                      <NotificationsButton />
                      
                      <button
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="flex items-center space-x-2 ml-2 p-1 rounded-md hover:bg-dark-light transition-colors"
                        aria-expanded={isProfileDropdownOpen}
                        aria-haspopup="true"
                      >
                        <div className="relative">
                          <Avatar 
                            src={user?.profileImage} 
                            alt={user?.name || ''} 
                            size="sm" 
                            className="border-2 border-blue-500 shadow-md"
                          />
                          <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-1 ring-dark"></span>
                        </div>
                        <span className="text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                        <FaChevronDown className={`text-xs opacity-70 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 glass-light rounded-md shadow-lg py-1 z-50 border border-dark-accent/50 animate-fadeIn">
                        <div className="px-4 py-3 border-b border-dark-accent/30">
                          <div className="flex items-center">
                            <Avatar 
                              src={user?.profileImage} 
                              alt={user?.name || ''} 
                              size="md"
                              className="border-2 border-blue-500" 
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium">{user?.name}</p>
                              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                              <div className="flex items-center mt-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>
                                <span className="text-xs text-green-400 ml-1">Online</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm hover:bg-dark-light flex items-center space-x-2"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <FaUser className="text-blue-400" />
                            <span>My Profile</span>
                          </Link>
                          
                          <Link
                            to="/notes/my-notes"
                            className="block px-4 py-2 text-sm hover:bg-dark-light flex items-center space-x-2"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <FaBookmark className="text-blue-400" />
                            <span>My Notes</span>
                          </Link>
                          
                          <Link
                            to="/profile/edit"
                            className="block px-4 py-2 text-sm hover:bg-dark-light flex items-center space-x-2"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <FaPen className="text-blue-400" />
                            <span>Edit Profile</span>
                          </Link>
                          
                          <Link
                            to="/settings"
                            className="block px-4 py-2 text-sm hover:bg-dark-light flex items-center space-x-2"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <FaSlidersH className="text-blue-400" />
                            <span>Settings</span>
                          </Link>
                        </div>
                        
                        <div className="border-t border-dark-accent/30 py-1">
                          <Link
                            to="/help"
                            className="block px-4 py-2 text-sm hover:bg-dark-light flex items-center space-x-2"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <FaQuestionCircle className="text-blue-400" />
                            <span>Help & Support</span>
                          </Link>
                          
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left block px-4 py-2 text-sm hover:bg-dark-light flex items-center space-x-2"
                          >
                            <FaSignOutAlt className="text-blue-400" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
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
                  to="/chat"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaCommentAlt className="mr-1 text-green-400" /> Messages
                </Link>
                <div className="border-t border-dark-accent/20 my-2 pt-2">
                  <div className="flex items-center px-3 py-2">
                    <Avatar 
                      src={user?.profileImage} 
                      alt={user?.name || ''} 
                      size="sm"
                      className="border-2 border-blue-500" 
                    />
                    <div className="ml-2">
                      <div className="text-sm font-medium">{user?.name}</div>
                      <div className="text-xs text-accent truncate">{user?.email}</div>
                      <div className="flex items-center mt-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>
                        <span className="text-xs text-green-400 ml-1">Online</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUser className="mr-1 text-blue-400" /> Profile
                  </Link>
                  <Link
                    to="/notes/my-notes"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaBookmark className="mr-1 text-blue-400" /> My Notes
                  </Link>
                  <Link
                    to="/profile/edit"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaPen className="mr-1 text-blue-400" /> Edit Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaSlidersH className="mr-1 text-blue-400" /> Settings
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
                </div>
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