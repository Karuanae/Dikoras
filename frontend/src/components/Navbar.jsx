import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const { user, isAuthenticated, isAdmin, isLawyer, isClient, logout } = useAuth();

  const handleMobileLinkClick = () => setIsMenuOpen(false);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowNotifications(false);
      setShowAvatarMenu(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/70 shadow-lg rounded-b-2xl border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent drop-shadow-lg tracking-wide">
              DIKORAS
            </span>
          </div>

          {/* Hamburger for mobile (unauthenticated only) */}
          {!isAuthenticated() && (
            <button
              className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-100 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 ml-auto">
            {isAuthenticated() ? (
              <>
                {/* Role-based dashboard links */}
                {isAdmin() && (
                  <NavLink 
                    to="/admin-dashboard" 
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 text-base font-semibold transition-all duration-200 rounded-lg ${
                        isActive 
                          ? 'border-blue-500 text-gray-900 bg-blue-50' 
                          : 'border-transparent text-blue-900 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
                      }`
                    }
                  >
                    Admin Dashboard
                  </NavLink>
                )}
                {isClient() && (
                  <NavLink 
                    to="/client/dashboard" 
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 text-base font-semibold transition-all duration-200 rounded-lg ${
                        isActive 
                          ? 'border-blue-500 text-gray-900 bg-blue-50' 
                          : 'border-transparent text-blue-900 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
                      }`
                    }
                  >
                    Client Dashboard
                  </NavLink>
                )}
                {isLawyer() && (
                  <NavLink 
                    to="/lawyer/dashboard" 
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 text-base font-semibold transition-all duration-200 rounded-lg ${
                        isActive 
                          ? 'border-blue-500 text-gray-900 bg-blue-50' 
                          : 'border-transparent text-blue-900 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
                      }`
                    }
                  >
                    Lawyer Dashboard
                  </NavLink>
                )}

                {/* Notifications */}
                <div className="relative">
                  <button 
                    className="relative p-2 rounded-lg text-blue-900 hover:bg-blue-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotifications(!showNotifications);
                      setShowAvatarMenu(false);
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-blue-100 z-50">
                      <div className="p-4 text-blue-900">You have no new notifications</div>
                      <div className="flex border-t border-blue-100">
                        <button className="w-1/2 py-2 text-blue-700 hover:bg-blue-50 rounded-bl-xl">
                          See All Notifications
                        </button>
                        <button className="w-1/2 py-2 text-blue-700 hover:bg-blue-50 rounded-br-xl">
                          Mark All as Read
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar Menu */}
                <div className="relative">
                  <button 
                    className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center border border-blue-300 hover:bg-blue-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAvatarMenu(!showAvatarMenu);
                      setShowNotifications(false);
                    }}
                  >
                    <img 
                      src={`https://ui-avatars.com/api/?name=${user?.role === 'client' ? 'CL' : user?.role === 'lawyer' ? 'LW' : 'AD'}&background=blue&color=fff`} 
                      alt="User Avatar" 
                      className="w-8 h-8 rounded-full font-bold" 
                    />
                  </button>
                  
                  {showAvatarMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-blue-100 z-50">
                      <NavLink 
                        to={isClient() ? "/client/dashboard" : isLawyer() ? "/lawyer/dashboard" : "/admin-dashboard"} 
                        className="block w-full py-3 px-4 text-blue-700 hover:bg-blue-50 rounded-t-xl transition-colors"
                        onClick={() => setShowAvatarMenu(false)}
                      >
                        Profile
                      </NavLink>
                      <button 
                        className="block w-full py-3 px-4 text-blue-700 hover:bg-blue-50 rounded-b-xl transition-colors text-left"
                        onClick={() => {
                          setShowAvatarMenu(false);
                          logout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Unauthenticated desktop navigation
              <>
                <NavLink 
                  to="/" 
                  end 
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 text-base font-semibold transition-all duration-200 rounded-lg ${
                      isActive 
                        ? 'border-blue-500 text-gray-900 bg-blue-50' 
                        : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink 
                  to="/how-it-works" 
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 text-base font-semibold transition-all duration-200 rounded-lg ${
                      isActive 
                        ? 'border-blue-500 text-gray-900 bg-blue-50' 
                        : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                    }`
                  }
                >
                  How It Works
                </NavLink>
                <NavLink 
                  to="/legal-services" 
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 text-base font-semibold transition-all duration-200 rounded-lg ${
                      isActive 
                        ? 'border-blue-500 text-gray-900 bg-blue-50' 
                        : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                    }`
                  }
                >
                  Legal Services
                </NavLink>
                <NavLink 
                  to="/lawyers-directory" 
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 text-base font-semibold transition-all duration-200 rounded-lg ${
                      isActive 
                        ? 'border-blue-500 text-gray-900 bg-blue-50' 
                        : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                    }`
                  }
                >
                  Lawyers
                </NavLink>
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-lg shadow-md text-base font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 transition-all duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu for unauthenticated users */}
      {!isAuthenticated() && isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg rounded-b-2xl border-b border-blue-100 z-50">
          <div className="pt-2 pb-3 space-y-1">
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) =>
                `block pl-3 pr-4 py-3 text-base font-semibold rounded-lg mx-2 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                }`
              } 
              onClick={handleMobileLinkClick}
            >
              Home
            </NavLink>
            <NavLink 
              to="/how-it-works" 
              className={({ isActive }) =>
                `block pl-3 pr-4 py-3 text-base font-semibold rounded-lg mx-2 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                }`
              } 
              onClick={handleMobileLinkClick}
            >
              How It Works
            </NavLink>
            <NavLink 
              to="/legal-services" 
              className={({ isActive }) =>
                `block pl-3 pr-4 py-3 text-base font-semibold rounded-lg mx-2 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                }`
              } 
              onClick={handleMobileLinkClick}
            >
              Legal Services
            </NavLink>
            <NavLink 
              to="/lawyers-directory" 
              className={({ isActive }) =>
                `block pl-3 pr-4 py-3 text-base font-semibold rounded-lg mx-2 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-transparent text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                }`
              } 
              onClick={handleMobileLinkClick}
            >
              Lawyers
            </NavLink>
            <div className="mt-4 space-y-2 px-4 border-t border-blue-100 pt-4">
              <Link
                to="/login"
                className="block w-full px-5 py-3 rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 transition-all duration-200 text-center"
                onClick={handleMobileLinkClick}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block w-full px-5 py-3 rounded-lg shadow-md text-base font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 transition-all duration-200 text-center"
                onClick={handleMobileLinkClick}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;