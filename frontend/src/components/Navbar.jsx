import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClientNotifications, getLawyerNotifications, markNotificationAsRead } from '../services/api';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, isAdmin, isLawyer, isClient, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated()) {
      fetchNotifications();
    }
  }, [isAuthenticated, location]);

  const fetchNotifications = async () => {
    try {
      let data = [];
      if (isClient()) {
        data = await getClientNotifications();
      } else if (isLawyer()) {
        data = await getLawyerNotifications();
      }
      
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification.id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleMobileLinkClick = () => setIsMenuOpen(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowNotifications(false);
      setShowAvatarMenu(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getDashboardPath = () => {
    if (isAdmin()) return '/admin/dashboard';
    if (isClient()) return '/client/dashboard';
    if (isLawyer()) return '/lawyer/dashboard';
    return '/';
  };

  const getRoleColor = () => {
    if (isAdmin()) return 'from-purple-500 to-purple-600';
    if (isLawyer()) return 'from-green-500 to-green-600';
    if (isClient()) return 'from-blue-500 to-blue-600';
    return 'from-gray-500 to-gray-600';
  };

  const getRoleBadge = () => {
    if (isAdmin()) return { text: 'Admin', color: 'bg-gradient-to-r from-purple-500 to-purple-600' };
    if (isLawyer()) return { text: 'Lawyer', color: 'bg-gradient-to-r from-green-500 to-green-600' };
    if (isClient()) return { text: 'Client', color: 'bg-gradient-to-r from-blue-500 to-blue-600' };
    return { text: 'User', color: 'bg-gradient-to-r from-gray-500 to-gray-600' };
  };

  const roleBadge = getRoleBadge();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-200/50' 
        : 'bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <div className="absolute -inset-1 bg-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 bg-clip-text text-transparent">
                  DIKORAS
                </span>
                {isAuthenticated() && (
                  <span className={`text-xs font-semibold ${roleBadge.color} text-white px-2 py-1 rounded-full mt-1 shadow-lg`}>
                    {roleBadge.text}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {isAuthenticated() ? (
              <>
                {/* Navigation Links */}
                <div className="flex items-center space-x-1 mr-4">
                  <NavLink 
                    to={getDashboardPath()}
                    className={({ isActive }) => 
                      `relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 group ${
                        isActive 
                          ? 'text-blue-700 bg-blue-50 shadow-inner' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                      }`
                    }
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Dashboard</span>
                    </span>
                  </NavLink>

                  <NavLink 
                    to="/chat"
                    className={({ isActive }) => 
                      `relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 group ${
                        isActive 
                          ? 'text-blue-700 bg-blue-50 shadow-inner' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                      }`
                    }
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Messages</span>
                    </span>
                  </NavLink>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    className={`relative p-3 rounded-2xl transition-all duration-300 group ${
                      showNotifications 
                        ? 'bg-blue-50 text-blue-600 shadow-inner' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotifications(!showNotifications);
                      setShowAvatarMenu(false);
                    }}
                  >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/50 backdrop-blur-xl z-50 transform origin-top-right animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Header */}
                      <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                          {unreadCount > 0 && (
                            <button 
                              onClick={handleMarkAllAsRead}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            </div>
                            <p className="text-gray-600 font-medium">No notifications</p>
                            <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                          </div>
                        ) : (
                          notifications.slice(0, 6).map(notification => (
                            <div 
                              key={notification.id}
                              className={`p-4 border-b border-gray-100/50 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 group ${
                                !notification.is_read ? 'bg-blue-25 border-l-4 border-l-blue-500' : ''
                              }`}
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                                  !notification.is_read 
                                    ? 'bg-blue-500 animate-pulse' 
                                    : 'bg-gray-300'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2 flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Footer */}
                      <div className="p-4 border-t border-gray-200/50 bg-gray-50/50 rounded-b-2xl">
                        <Link 
                          to={isClient() ? "/client/notifications" : isLawyer() ? "/lawyer/notifications" : "/admin/notifications"}
                          className="block text-center text-blue-600 hover:text-blue-700 font-semibold text-sm py-2 rounded-xl hover:bg-white transition-all duration-200"
                          onClick={() => setShowNotifications(false)}
                        >
                          View All Notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Menu */}
                <div className="relative ml-2">
                  <button 
                    className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-blue-50/50 transition-all duration-300 group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAvatarMenu(!showAvatarMenu);
                      setShowNotifications(false);
                    }}
                  >
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getRoleColor()} flex items-center justify-center text-white font-bold shadow-2xl group-hover:scale-105 transition-transform duration-300`}>
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </div>
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showAvatarMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showAvatarMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/50 backdrop-blur-xl z-50 transform origin-top-right animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* User Info */}
                      <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200/50 rounded-t-2xl">
                        <div className="flex items-center space-x-3">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getRoleColor()} flex items-center justify-center text-white font-bold shadow-lg`}>
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 capitalize mt-1">{user?.role}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="p-2">
                        <Link 
                          to={getDashboardPath()}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200 group"
                          onClick={() => setShowAvatarMenu(false)}
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile & Settings</span>
                        </Link>
                        
                        <button 
                          onClick={() => {
                            setShowAvatarMenu(false);
                            logout();
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-xl transition-all duration-200 group mt-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Public Navigation
              <div className="flex items-center space-x-3">
                <NavLink 
                  to="/legal-services" 
                  className="px-6 py-3 text-gray-600 hover:text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50/50 transition-all duration-300"
                >
                  Legal Services
                </NavLink>
                <NavLink 
                  to="/lawyers-directory" 
                  className="px-6 py-3 text-gray-600 hover:text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50/50 transition-all duration-300"
                >
                  Find Lawyers
                </NavLink>
                <Link
                  to="/login"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl hover:from-gray-200 hover:to-gray-100 border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-3 rounded-2xl text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {isAuthenticated() ? (
              <>
                <div className="p-4 border-b border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getRoleColor()} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>
                
                <NavLink 
                  to={getDashboardPath()}
                  className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200"
                  onClick={handleMobileLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard</span>
                </NavLink>
                
                <NavLink 
                  to="/chat"
                  className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200"
                  onClick={handleMobileLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Messages</span>
                </NavLink>
                
                <button 
                  onClick={() => {
                    handleMobileLinkClick();
                    logout();
                  }}
                  className="flex items-center space-x-3 w-full text-left px-4 py-4 text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/legal-services"
                  className="block px-4 py-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200"
                  onClick={handleMobileLinkClick}
                >
                  Legal Services
                </Link>
                <Link
                  to="/lawyers-directory"
                  className="block px-4 py-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200"
                  onClick={handleMobileLinkClick}
                >
                  Find Lawyers
                </Link>
                <Link
                  to="/login"
                  className="block px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl text-center shadow-lg mt-4"
                  onClick={handleMobileLinkClick}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-4 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 font-semibold rounded-xl text-center shadow-lg border border-gray-200 mt-2"
                  onClick={handleMobileLinkClick}
                >
                  Get Started
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