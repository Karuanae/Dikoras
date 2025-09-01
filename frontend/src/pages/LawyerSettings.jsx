import React from 'react';

export default function LawyerSettings() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 text-lg mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Email Address</label>
              <input 
                type="email" 
                defaultValue="john.doe@lawfirm.com"
                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">Phone Number</label>
              <input 
                type="tel" 
                defaultValue="+1 (555) 123-4567"
                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-900 text-lg mb-4">Notification Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-blue-600" defaultChecked />
              <span className="ml-2 text-blue-700">Email Notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-blue-600" defaultChecked />
              <span className="ml-2 text-blue-700">SMS Notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-blue-600" />
              <span className="ml-2 text-blue-700">Marketing Emails</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-4">
          Save Changes
        </button>
        <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
          Cancel
        </button>
      </div>
    </>
  );
}