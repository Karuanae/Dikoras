import React from 'react';

export default function LawyerMessages() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">Clients</h3>
          <div className="space-y-2">
            <div className="p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">JS</div>
                <div>
                  <p className="font-semibold text-blue-900">John Smith</p>
                  <p className="text-sm text-blue-600">Contract Review Case</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">SJ</div>
                <div>
                  <p className="font-semibold text-blue-900">Sarah Johnson</p>
                  <p className="text-sm text-blue-600">Divorce Case</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">Conversation with John Smith</h3>
          <div className="h-64 overflow-y-auto space-y-4 mb-4">
            <div className="flex justify-start">
              <div className="bg-blue-100 rounded-lg p-3 max-w-xs">
                <p className="text-blue-900">Hello John, I've reviewed your contract and have some suggestions.</p>
                <span className="text-xs text-blue-600">10:30 AM</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                <p className="text-green-900">Thank you! When can we discuss the changes?</p>
                <span className="text-xs text-green-600">10:32 AM</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}