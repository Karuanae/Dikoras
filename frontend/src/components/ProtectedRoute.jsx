
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole, checkApproval = false }) => {
  const { user, isAuthenticated, isLawyer, isClient, isPendingLawyer, isAdmin } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check for pending lawyer approval
  if (checkApproval && isPendingLawyer()) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Admin route protection
  if (requiredRole === 'admin' && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Lawyer route protection
  if (requiredRole === 'lawyer' && !isLawyer()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Client route protection
  if (requiredRole === 'client' && !isClient()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;