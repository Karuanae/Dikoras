import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import ClientCases from './pages/ClientCases';
import ClientMessages from './pages/ClientMessages';
import ClientDocuments from './pages/ClientDocuments';
import ClientInvoices from './pages/ClientInvoices';
import ClientTransactions from './pages/ClientTransactions';
import LawyerDashboard from './pages/LawyerDashboard';
import LawyerCases from './pages/LawyerCases';
import LawyerClients from './pages/LawyerClients';
import LawyerMessages from './pages/LawyerMessages';
import LawyerDocuments from './pages/LawyerDocuments';
import LawyerInvoices from './pages/LawyerInvoices';
import LawyerProfile from './pages/LawyerProfile';
import LawyerSettings from './pages/LawyerSettings';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import HowItWorks from './pages/HowItWorks';
import LegalServices from './pages/LegalServices';
import ClientLayout from './components/ClientLayout';
import LawyerLayout from './components/LawyerLayout';

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
            
            {/* Protected Routes - Client Routes with Layout */}
            <Route path="/client" element={
              <ProtectedRoute requiredRole="client">
                <ClientLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="cases" element={<ClientCases />} />
              <Route path="messages" element={<ClientMessages />} />
              <Route path="documents" element={<ClientDocuments />} />
              <Route path="invoices" element={<ClientInvoices />} />
              <Route path="transactions" element={<ClientTransactions />} />
            </Route>
            
            {/* Protected Routes - Lawyer Routes with Layout */}
            <Route path="/lawyer" element={
              <ProtectedRoute requiredRole="lawyer">
                <LawyerLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<LawyerDashboard />} />
              <Route path="cases" element={<LawyerCases />} />
              <Route path="clients" element={<LawyerClients />} />
              <Route path="messages" element={<LawyerMessages />} />
              <Route path="documents" element={<LawyerDocuments />} />
              <Route path="invoices" element={<LawyerInvoices />} />
              <Route path="profile" element={<LawyerProfile />} />
              <Route path="settings" element={<LawyerSettings />} />
            </Route>
            
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