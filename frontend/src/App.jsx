import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import LawyerDashboard from './pages/LawyerDashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import HowItWorks from './pages/HowItWorks';
import LegalServices from './pages/LegalServices';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/legal-services" element={<LegalServices />} />
            
            {/* Protected Routes - Client Dashboard (requires client role) */}
            <Route path="/client/dashboard" element={
              <ProtectedRoute requiredRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            } />
            
            {/* Protected Routes - Lawyer Dashboard (requires lawyer role) */}
            <Route path="/lawyer/dashboard" element={
              <ProtectedRoute requiredRole="lawyer">
                <LawyerDashboard />
              </ProtectedRoute>
            } />
            
            {/* 404 Page */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;