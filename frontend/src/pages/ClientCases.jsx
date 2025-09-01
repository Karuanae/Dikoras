import React from 'react';

export default function ClientCases() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">My Cases</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Case Cards */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 text-lg mb-2">Contract Review</h3>
          <p className="text-blue-700 text-sm mb-4">Status: In Progress</p>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 text-sm">Assigned to: John Doe</span>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              View Details
            </button>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-900 text-lg mb-2">Divorce Case</h3>
          <p className="text-green-700 text-sm mb-4">Status: Completed</p>
          <div className="flex justify-between items-center">
            <span className="text-green-600 text-sm">Assigned to: Sarah Smith</span>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              View Details
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="font-bold text-yellow-900 text-lg mb-2">Business Formation</h3>
          <p className="text-yellow-700 text-sm mb-4">Status: Pending</p>
          <div className="flex justify-between items-center">
            <span className="text-yellow-600 text-sm">Awating assignment</span>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700">
              View Details
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200">
          Post New Case
        </button>
      </div>
    </>
  );
}