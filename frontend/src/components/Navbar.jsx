import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Helper to close menu on mobile link click
  const handleMobileLinkClick = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/70 shadow-lg rounded-b-2xl border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo left */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent drop-shadow-lg tracking-wide">DIKORAS</span>
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
          {/* Right: Authenticated icons or public links (desktop) */}
          <div className="hidden md:flex items-center space-x-6 ml-auto">
            {isAuthenticated() ? (
              <>
                <button className="relative" onClick={() => setShowNotifications(!showNotifications)}>
                  <span className="sr-only">Notifications</span>
                  <svg className="w-6 w-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-blue-100 z-50">
                      <div className="p-4 text-blue-900">You have no new notifications</div>
                      <div className="flex border-t border-blue-100">
                        <button className="w-1/2 py-2 text-blue-700 hover:bg-blue-50">See All Notifications</button>
                        <button className="w-1/2 py-2 text-blue-700 hover:bg-blue-50">Mark All as Read</button>
                      </div>
                    </div>
                  )}
                </button>
                <button className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center border border-blue-300" onClick={() => setShowAvatarMenu(!showAvatarMenu)}>
                  <img src={`https://ui-avatars.com/api/?name=${user?.role === 'client' ? 'CL' : 'LW'}&background=blue&color=fff`} alt="User Avatar" className="w-8 h-8 rounded-full font-bold" />
                </button>
                {showAvatarMenu && (
                  <div className="absolute right-4 mt-14 w-40 bg-white rounded-xl shadow-lg border border-blue-100 z-50">
                    <button className="w-full py-2 text-blue-700 hover:bg-blue-50">Profile</button>
                    <button className="w-full py-2 text-blue-700 hover:bg-blue-50" onClick={logout}>Logout</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <NavLink to="/" end className={({ isActive }) =>
                  `inline-flex items-center px-3 pt-1 border-b-2 text-base font-semibold transition-all duration-200 rounded-lg ${isActive ? 'border-blue-500 text-gray-900 bg-blue-50' : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'}`
                }>
                  Home
                </NavLink>
                <NavLink to="/how-it-works" className={({ isActive }) =>
                  `inline-flex items-center px-3 pt-1 border-b-2 text-base font-semibold transition-all duration-200 rounded-lg ${isActive ? 'border-blue-500 text-gray-900 bg-blue-50' : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'}`
                }>
                  How It Works
                </NavLink>
                <NavLink to="/legal-services" className={({ isActive }) =>
                  `inline-flex items-center px-3 pt-1 border-b-2 text-base font-semibold transition-all duration-200 rounded-lg ${isActive ? 'border-blue-500 text-gray-900 bg-blue-50' : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'}`
                }>
                  Legal Services
                </NavLink>
                <NavLink to="/lawyers-directory" className={({ isActive }) => // Changed from "/lawyers" to "/lawyers-directory"
                  `inline-flex items-center px-3 pt-1 border-b-2 text-base font-semibold transition-all duration-200 rounded-lg ${isActive ? 'border-blue-500 text-gray-900 bg-blue-50' : 'border-transparent text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'}`
                }>
                  Lawyers
                </NavLink>
                <Link
                  to="/login"
                  className="ml-4 px-5 py-2 rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="ml-4 px-5 py-2 rounded-lg shadow-md text-base font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
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
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white/90 backdrop-blur-lg shadow-lg rounded-b-2xl border-b border-blue-100 z-50">
          <div className="pt-2 pb-3 space-y-1">
            <NavLink to="/" end className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-semibold rounded-lg shadow-sm transition-all duration-200 ${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-600'}`
            } onClick={handleMobileLinkClick}>
              Home
            </NavLink>
            <NavLink to="/how-it-works" className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-semibold rounded-lg shadow-sm transition-all duration-200 ${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-600'}`
            } onClick={handleMobileLinkClick}>
              How It Works
            </NavLink>
            <NavLink to="/legal-services" className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-semibold rounded-lg shadow-sm transition-all duration-200 ${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-600'}`
            } onClick={handleMobileLinkClick}>
              Legal Services
            </NavLink>
            <NavLink to="/lawyers-directory" className={({ isActive }) => // Changed from "/lawyers" to "/lawyers-directory"
              `block pl-3 pr-4 py-2 border-l-4 text-base font-semibold rounded-lg shadow-sm transition-all duration-200 ${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-600'}`
            } onClick={handleMobileLinkClick}>
              Lawyers
            </NavLink>
            <div className="mt-4 space-y-2 px-4">
              <Link
                to="/login"
                className="w-full px-5 py-2 rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 transition-all duration-200"
                onClick={handleMobileLinkClick}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="w-full px-5 py-2 rounded-lg shadow-md text-base font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 transition-all duration-200"
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