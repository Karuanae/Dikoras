import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const sidebarLinks = [
  { name: 'Dashboard', path: '/lawyer/dashboard' },
  { name: 'Cases', path: '/lawyer/cases' },
  { name: 'Clients', path: '/lawyer/clients' },
  { name: 'Chats', path: '/lawyer/chats' },
  { name: 'Documents', path: '/lawyer/documents' },
  { name: 'Invoices', path: '/lawyer/invoices' },
  { name: 'Profile', path: '/lawyer/profile' },
];

export default function LawyerLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 backdrop-blur-lg">
      {/* Glassmorphic spacer below Navbar */}
      <div className="h-12 md:h-16 w-full max-w-7xl mx-auto rounded-b-2xl shadow-lg bg-white/60 border-b border-blue-100"></div>
      
      <div className="flex max-w-7xl mx-auto pb-16 px-4 mt-4">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-6 mr-8 hidden md:block">
          <nav>
            <ul className="space-y-2">
              {sidebarLinks.map((link) => (
                <li key={link.name}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) => 
                      `w-full block px-4 py-2 rounded-lg font-medium text-blue-900 hover:bg-blue-100 transition-all duration-150 ${
                        isActive ? 'bg-blue-50 font-bold' : ''
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-8">
            <Outlet /> {/* This is where child routes will render */}
          </div>
        </main>
      </div>
    </div>
  );
}