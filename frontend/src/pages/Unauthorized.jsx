import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 px-4 mt-16 backdrop-blur-lg">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-blue-100 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-4 drop-shadow-lg">Access Denied</h1>
        <p className="text-blue-700 mb-6">
          You don't have permission to access this page. Please contact support if you believe this is an error.
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-semibold py-2 px-6 rounded-xl shadow-lg transition-all duration-200"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="block w-full bg-gradient-to-r from-gray-600 to-gray-400 hover:from-gray-700 hover:to-gray-500 text-white font-semibold py-2 px-6 rounded-xl shadow-lg transition-all duration-200"
          >
            Login with Different Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;