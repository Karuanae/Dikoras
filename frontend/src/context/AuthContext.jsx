import React, { createContext, useContext, useState, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext();

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user is a lawyer
  const isLawyer = () => {
    return user?.role === 'lawyer';
  };

  // Check if user is a client
  const isClient = () => {
    return user?.role === 'client';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isLawyer,
    isClient
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context itself (optional, if needed)
export default AuthContext;