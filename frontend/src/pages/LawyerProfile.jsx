import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerProfile } from '../services/api';

export default function LawyerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const data = await getLawyerProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again.');
        // Don't automatically redirect to login
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'JD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile functionality
    alert('Edit profile functionality coming soon!');
  };

  const handleBackToDashboard = () => {
    navigate('/lawyer/dashboard');
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-blue-700 text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-900">Profile</h1>
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Profile</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Fallback profile data if API returns null
  const profileData = profile || {
    name: 'John Doe',
    specialization: 'Corporate Law',
    experience: 5,
    barAssociation: 'State Bar Association',
    barNumber: 'BAR123456',
    hourlyRate: 250,
    bio: 'No bio available. Please update your profile information.',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Law Street, Suite 100, City, State 12345'
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Lawyer Profile</h1>
          <p className="text-lg text-blue-700">Manage your professional information and settings</p>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
            onClick={handleBackToDashboard}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
            onClick={handleEditProfile}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Profile Summary */}
        <div className="lg:col-span-1">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 shadow-sm">
            <div className="flex flex-col items-center text-center">
              {/* Profile Avatar */}
              <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                {getInitials(profileData.name)}
              </div>
              
              {/* Basic Info */}
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{profileData.name}</h2>
              <p className="text-blue-600 font-semibold mb-3">{profileData.specialization}</p>
              
              {/* Stats */}
              <div className="bg-white rounded-lg p-4 w-full mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{profileData.experience}</div>
                    <div className="text-blue-600 text-sm">Years Exp.</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">${profileData.hourlyRate}</div>
                    <div className="text-blue-600 text-sm">Hourly Rate</div>
                  </div>
                </div>
              </div>

              {/* Bar Association */}
              <div className="w-full">
                <div className="text-blue-700 text-sm font-semibold mb-1">Bar Association</div>
                <div className="text-blue-900 text-sm">{profileData.barAssociation}</div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm mt-6">
            <h3 className="font-bold text-blue-900 text-lg mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-blue-700 text-sm font-medium mb-1">Email</label>
                <p className="text-blue-900">{profileData.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-blue-700 text-sm font-medium mb-1">Phone</label>
                <p className="text-blue-900">{profileData.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-blue-700 text-sm font-medium mb-1">Address</label>
                <p className="text-blue-900 text-sm">{profileData.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Professional Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
            <h3 className="font-bold text-blue-900 text-xl mb-6 pb-2 border-b border-blue-100">Professional Information</h3>
            
            {/* Professional Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-blue-700 text-sm font-semibold mb-2">Specialization</label>
                <p className="text-blue-900 text-lg font-medium">{profileData.specialization}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-blue-700 text-sm font-semibold mb-2">Bar Number</label>
                <p className="text-blue-900 text-lg font-medium">{profileData.barNumber}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-blue-700 text-sm font-semibold mb-2">Years of Experience</label>
                <p className="text-blue-900 text-lg font-medium">{profileData.experience} Years</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-blue-700 text-sm font-semibold mb-2">Hourly Rate</label>
                <p className="text-blue-900 text-lg font-medium">${profileData.hourlyRate}/hour</p>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-8">
              <h3 className="font-bold text-blue-900 text-xl mb-4">Professional Bio</h3>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-blue-700 leading-relaxed">
                  {profileData.bio || 'No bio available. Please update your professional bio to let clients know more about your expertise and experience.'}
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="font-bold text-blue-900 text-xl mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <label className="block text-green-700 text-sm font-semibold mb-2">Bar Association Status</label>
                  <p className="text-green-900 font-medium">Active Member</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <label className="block text-purple-700 text-sm font-semibold mb-2">Profile Completion</label>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-purple-900 font-medium text-sm">75%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-blue-600 rounded-xl p-6 mt-6 text-center">
            <h3 className="text-white text-xl font-bold mb-2">Need to update your information?</h3>
            <p className="text-blue-100 mb-4">Keep your profile updated to attract more clients and maintain professional credibility.</p>
            <button 
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
              onClick={handleEditProfile}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile Information
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}