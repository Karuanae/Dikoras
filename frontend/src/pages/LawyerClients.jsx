import React from 'react';

export default function LawyerClients() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Clients</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">JS</div>
            <div>
              <h3 className="font-bold text-blue-900">John Smith</h3>
              <p className="text-blue-600 text-sm">3 Active Cases</p>
            </div>
          </div>
          <p className="text-blue-700 text-sm mb-4">Corporate Law, Contract Review</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 w-full">
            Contact Client
          </button>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">SJ</div>
            <div>
              <h3 className="font-bold text-green-900">Sarah Johnson</h3>
              <p className="text-green-600 text-sm">1 Completed Case</p>
            </div>
          </div>
          <p className="text-green-700 text-sm mb-4">Family Law, Divorce</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 w-full">
            Contact Client
          </button>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">MW</div>
            <div>
              <h3 className="font-bold text-purple-900">Mike Wilson</h3>
              <p className="text-purple-600 text-sm">1 Pending Case</p>
            </div>
          </div>
          <p className="text-purple-700 text-sm mb-4">Business Law, LLC Formation</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 w-full">
            Contact Client
          </button>
        </div>
      </div>
    </>
  );
}