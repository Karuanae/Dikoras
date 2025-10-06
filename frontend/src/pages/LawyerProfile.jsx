import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SimpleLawyerProfile() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/lawyer/dashboard');
  };

  // Get basic user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lawyer Profile</h1>
            <p className="text-gray-600">Your professional information</p>
          </div>
          <button
            onClick={handleBack}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Simple Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-blue-600 mt-2 capitalize">Role: {user.role}</p>
            {user.status && (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                user.status === 'approved' ? 'bg-green-100 text-green-800' :
                user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Status: {user.status}
              </span>
            )}
          </div>

          <div className="text-center text-gray-500 py-4">
            <p className="text-lg mb-2">Profile management coming soon!</p>
            <p className="text-sm">For now, you can manage your basic information through the settings page.</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">0</div>
            <div className="text-blue-700">Active Cases</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-900">0</div>
            <div className="text-green-700">Total Clients</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-900">0</div>
            <div className="text-purple-700">Messages</div>
          </div>
        </div>
      </div>
    </div>
  );
}