import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Mail } from 'lucide-react';

const PendingApproval = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Application Under Review
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for applying, {user?.firstName}! Your lawyer application is currently 
          being reviewed by our admin team. This process usually takes 1-2 business days.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-700 text-sm">
              You will receive an email notification once your application is approved.
            </span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Sign Out
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          Need help? Contact support at support@dikoras.com
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;