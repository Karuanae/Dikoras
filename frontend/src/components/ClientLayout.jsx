import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getUserFromStorage } from '../services/api';

const sidebarLinks = [
  { 
    name: 'Dashboard', 
    path: '/client/dashboard', 
    icon: '📊',
    description: 'Case overview & analytics'
  },
  { 
    name: 'My Cases', 
    path: '/client/cases', 
    icon: '⚖️',
    description: 'Your legal cases'
  },
  { 
    name: 'Chats', 
    path: '/client/chats', 
    icon: '💬',
    description: 'Communicate with lawyers'
  },
  { 
    name: 'Documents', 
    path: '/client/documents', 
    icon: '📁',
    description: 'Legal documents & files'
  },
  { 
    name: 'Invoices', 
    path: '/client/invoices', 
    icon: '🧾',
    description: 'Billing & payments'
  },
  { 
    name: 'Transactions', 
    path: '/client/transactions', 
    icon: '💰',
    description: 'Payment history'
  },
];

export default function ClientLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const user = getUserFromStorage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 backdrop-blur-xl">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Glassmorphic Header Spacer */}
      <div className={`fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-blue-100/50 transition-all duration-300 ${
        scrolled ? 'shadow-2xl' : 'shadow-lg'
      }`}></div>
      
      <div className="flex max-w-7xl mx-auto pt-24 pb-8 px-4 lg:px-8">
        {/* Desktop Sidebar */}
        <aside className="w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100/50 p-8 mr-8 hidden lg:block sticky top-32 h-fit transition-all duration-300 hover:shadow-2xl">
          {/* Sidebar Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
              Client Portal
            </h2>
            <p className="text-sm text-gray-600 mt-2">Manage your legal matters</p>
          </div>

          {/* User Info Card */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-blue-600 truncate mt-1">{user?.email}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  Client
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav>
            <ul className="space-y-3">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.name}>
                    <NavLink
                      to={link.path}
                      className={({ isActive }) => 
                        `group relative flex items-center space-x-4 w-full px-6 py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200 transform scale-105' 
                            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50/80 hover:shadow-md'
                        }`
                      }
                    >
                      {/* Background Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl transition-opacity duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-5'
                      }`}></div>
                      
                      {/* Icon */}
                      <span className="text-xl relative z-10">{link.icon}</span>
                      
                      {/* Text Content */}
                      <div className="flex-1 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{link.name}</span>
                          {isActive && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <p className={`text-xs mt-1 transition-all duration-300 ${
                          isActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-600'
                        }`}>
                          {link.description}
                        </p>
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <p className="text-sm font-semibold text-green-800">Need Legal Help?</p>
              <p className="text-xs text-green-600 mt-1">Contact your lawyer for assistance</p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside className={`fixed top-0 left-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl z-50 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 h-full flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Client Portal
              </h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* User Info for Mobile */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-blue-600 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1">
              <ul className="space-y-2">
                {sidebarLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <li key={link.name}>
                      <NavLink
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) => 
                          `flex items-center space-x-3 w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'text-gray-700 hover:bg-blue-50'
                          }`
                        }
                      >
                        <span className="text-lg">{link.icon}</span>
                        <span>{link.name}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center space-x-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-blue-100/50 px-4 py-3 text-gray-700 hover:text-blue-600 transition-all duration-300"
            >
              <span>☰</span>
              <span className="font-semibold">Menu</span>
            </button>
          </div>

          {/* Content Container */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}