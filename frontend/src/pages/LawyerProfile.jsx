import React from 'react';

export default function LawyerProfile() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              JD
            </div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">John Doe, Esq.</h2>
            <p className="text-blue-600 mb-4">Corporate Lawyer</p>
            <div className="text-center">
              <p className="text-blue-700 text-sm">5+ Years Experience</p>
              <p className="text-blue-700 text-sm">New York Bar Association</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 text-lg mb-4">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Specialization</label>
              <p className="text-blue-900">Corporate Law, Contract Law</p>
            </div>
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Bar Number</label>
              <p className="text-blue-900">NY-123456</p>
            </div>
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Experience</label>
              <p className="text-blue-900">5 Years</p>
            </div>
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Hourly Rate</label>
              <p className="text-blue-900">$150/hour</p>
            </div>
          </div>

          <h3 className="font-bold text-blue-900 text-lg mb-4">Bio</h3>
          <p className="text-blue-700 mb-6">
            Experienced corporate lawyer specializing in contract review, business formation, 
            and legal compliance. Committed to providing excellent legal services to clients.
          </p>

          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Edit Profile
          </button>
        </div>
      </div>
    </>
  );
}