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
      const parsedUser = JSON.parse(userData);
      
      // Check if lawyer is pending approval
      if (parsedUser.role === 'lawyer' && parsedUser.status === 'pending') {
        setUser({ ...parsedUser, isPending: true });
      } else {
        setUser(parsedUser);
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData, token) => {
    // Check if lawyer is pending approval
    if (userData.role === 'lawyer' && userData.status === 'pending') {
      const pendingUser = { ...userData, isPending: true };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(pendingUser));
      setUser(pendingUser);
      return;
    }
    
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
    return !!user && !user.isPending;
  };

  // Check if user is authenticated (including pending lawyers)
  const isAuthenticatedIncludingPending = () => {
    return !!user;
  };


  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Check if user is a lawyer (approved)
  const isLawyer = () => {
    return user?.role === 'lawyer' && user?.status !== 'pending' && !user?.isPending;
  };

  // Check if user is a client
  const isClient = () => {
    return user?.role === 'client';
  };

  // Check if user is a pending lawyer
  const isPendingLawyer = () => {
    return user?.role === 'lawyer' && (user?.status === 'pending' || user?.isPending);
  };

  // Approve a pending lawyer (for admin use)
  const approveLawyer = (userId) => {
    if (user?.role === 'lawyer' && user.id === userId) {
      const approvedUser = { ...user, status: 'approved', isPending: false };
      localStorage.setItem('user', JSON.stringify(approvedUser));
      setUser(approvedUser);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAuthenticatedIncludingPending,
    isAdmin,
    isLawyer,
    isClient,
    isPendingLawyer,
    approveLawyer
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