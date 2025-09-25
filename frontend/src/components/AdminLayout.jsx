import React from 'react';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow py-4 px-8 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-blue-900">DIKORAS Admin Portal</h1>
        <div className="flex items-center gap-4">
          {/* Add profile, logout, etc. here if needed */}
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 w-full mx-auto">
        {children}
      </main>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 text-center mt-8">
        &copy; 2025 Dikoras Legal Services. All rights reserved.
      </footer>
    </div>
  );
}
