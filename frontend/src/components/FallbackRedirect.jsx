import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

export default function FallbackRedirect() {
  const { user, isAuthenticated, isAdmin, isLawyer, isClient, isPendingLawyer } = useAuth();
  const location = useLocation();
  
  // Check if user exists (including pending lawyers) instead of just isAuthenticated()
  if (user) {
    if (isAdmin()) return <Navigate to="/admin-dashboard" replace state={{ from: location }} />;
    if (isLawyer() || isPendingLawyer()) return <Navigate to="/lawyer/dashboard" replace state={{ from: location }} />;
    if (isClient()) return <Navigate to="/client/dashboard" replace state={{ from: location }} />;
  }
  
  return <Navigate to="/404" replace state={{ from: location }} />;
}