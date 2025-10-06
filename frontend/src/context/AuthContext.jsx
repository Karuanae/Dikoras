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
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
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

  // Check if user is authenticated (has valid token and user data)
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    return !!token && !!userData && !!user;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Check if user is a lawyer (approved)
  const isLawyer = () => {
    return user?.role === 'lawyer' && user?.status === 'approved';
  };

  // Check if user is a client
  const isClient = () => {
    return user?.role === 'client';
  };

  // Check if user is a pending lawyer
  const isPendingLawyer = () => {
    return user?.role === 'lawyer' && user?.status === 'pending';
  };

  // Get user status for conditional rendering
  const getUserStatus = () => {
    if (!user) return 'logged_out';
    if (user.role === 'lawyer' && user.status === 'pending') return 'pending_lawyer';
    if (user.role === 'lawyer' && user.status === 'approved') return 'approved_lawyer';
    return user.role;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isLawyer,
    isClient,
    isPendingLawyer,
    getUserStatus
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

export default AuthContext;