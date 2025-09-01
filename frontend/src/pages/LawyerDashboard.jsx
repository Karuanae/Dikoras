import React from 'react';

export default function LawyerDashboard() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Lawyer Dashboard</h1>
      <p className="text-lg text-blue-700 mb-6">Welcome to your dashboard. Here you can manage your cases, clients, and profile.</p>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">12</span>
          <span className="text-blue-900 font-semibold">Active Cases</span>
        </div>
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">8</span>
          <span className="text-blue-900 font-semibold">Clients</span>
        </div>
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">5</span>
          <span className="text-blue-900 font-semibold">Unread Messages</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex items-center space-x-4">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Add Case" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Add New Case</h2>
            <p className="text-blue-700 text-sm">Start a new case for a client and manage all details securely.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921223.png" alt="Message Client" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Message a Client</h2>
            <p className="text-blue-700 text-sm">Send updates, share documents, and communicate securely with your clients.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 md:col-span-2">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921224.png" alt="Upload Document" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Upload Document</h2>
            <p className="text-blue-700 text-sm">Easily upload and manage case-related documents for your clients.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200">
          Add Case & Manage Clients
        </button>
      </div>
    </>
  );
}