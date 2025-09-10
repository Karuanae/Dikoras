import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, checkApproval = false }) => {
  const { user, isAuthenticated, isLawyer, isClient, isPendingLawyer } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check for pending lawyer approval
  if (checkApproval && isPendingLawyer()) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check role-based access
  if (requiredRole === 'lawyer' && !isLawyer()) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole === 'client' && !isClient()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;