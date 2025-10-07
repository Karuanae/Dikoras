import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const sidebarLinks = [
  { 
    name: 'Dashboard', 
    path: '/lawyer/dashboard', 
    icon: '📊',
    description: 'Case overview & analytics'
  },
  { 
    name: 'Cases', 
    path: '/lawyer/cases', 
    icon: '📁',
    description: 'Manage your legal cases'
  },
  { 
    name: 'Clients', 
    path: '/lawyer/clients', 
    icon: '👥',
    description: 'Client relationships'
  },
  { 
    name: 'Chats', 
    path: '/lawyer/chats', 
    icon: '💬',
    description: 'Communicate with clients'
  },
  { 
    name: 'Documents', 
    path: '/lawyer/documents', 
    icon: '📄',
    description: 'Legal documents & files'
  },
  { 
    name: 'Invoices', 
    path: '/lawyer/invoices', 
    icon: '💰',
    description: 'Billing & payments'
  },
  { 
    name: 'Profile', 
    path: '/lawyer/profile', 
    icon: '👤',
    description: 'Account settings'
  },
];

export default function LawyerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 backdrop-blur-xl">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
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
              Lawyer Portal
            </h2>
            <p className="text-sm text-gray-600 mt-2">Manage your legal practice</p>
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
              <p className="text-sm font-semibold text-green-800">Need Help?</p>
              <p className="text-xs text-green-600 mt-1">Contact support for assistance</p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside className={`fixed top-0 left-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl z-50 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 h-full flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Lawyer Portal
              </h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                ✕
              </button>
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
                        onClick={() => setSidebarOpen(false)}
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
              onClick={() => setSidebarOpen(true)}
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