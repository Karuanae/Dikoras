import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

export default function FallbackRedirect() {
  const { isAuthenticated, isAdmin, isLawyer, isClient } = useAuth();
  const location = useLocation();
  if (isAuthenticated()) {
    if (isAdmin()) return <Navigate to="/admin-dashboard" replace state={{ from: location }} />;
    if (isLawyer()) return <Navigate to="/lawyer/dashboard" replace state={{ from: location }} />;
    if (isClient()) return <Navigate to="/client/dashboard" replace state={{ from: location }} />;
  }
  return <Navigate to="/404" replace state={{ from: location }} />;
}
