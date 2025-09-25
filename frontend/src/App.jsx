import React from 'react';
// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // You can log errorInfo to an error reporting service here
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-700 bg-red-100 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
          <pre className="text-sm whitespace-pre-wrap">{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import LawyerRegistration from './pages/LawyerRegistration'; // Add this import
import ClientDashboard from './pages/ClientDashboard';
import ClientCases from './pages/ClientCases';
import PostCase from './pages/PostCase';
import Chat from './pages/Chat';
import ClientDocuments from './pages/ClientDocuments';
import ClientInvoices from './pages/ClientInvoices';
import ClientTransactions from './pages/ClientTransactions';
import LawyerDashboard from './pages/LawyerDashboard';
import LawyerCases from './pages/LawyerCases';
import LawyerClients from './pages/LawyerClients';
import LawyerDocuments from './pages/LawyerDocuments';
import LawyerInvoices from './pages/LawyerInvoices';
import LawyerProfile from './pages/LawyerProfile';
import LawyerSettings from './pages/LawyerSettings';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

import HowItWorks from './pages/HowItWorks';
import LegalServices from './pages/LegalServices';
import LawyersDirectory from './pages/LawyersDirectory';
import ClientLayout from './components/ClientLayout';
import LawyerLayout from './components/LawyerLayout';

import PendingApproval from './pages/PendingApproval';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddServices from './pages/AdminAddServices';
import FallbackRedirect from './components/FallbackRedirect';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              {/* Admin Route */}
              <Route path="/admin-dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-lawyer" element={<LawyerRegistration />} /> {/* Add this route */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/legal-services" element={<LegalServices />} />
              <Route path="/lawyers-directory" element={<LawyersDirectory />} />
              <Route path="/pending-approval" element={<PendingApproval />} /> {/* Add this route */}

              {/* Admin Add Legal Service Route */}
              <Route path="/admin/services/add" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAddServices />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes - Client Routes with Layout */}
              <Route path="/client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="cases" element={<ClientCases />} />
                <Route path="cases/new" element={<PostCase />} />
                <Route path="chats" element={<Chat />} />
                <Route path="documents" element={<ClientDocuments />} />
                <Route path="invoices" element={<ClientInvoices />} />
                <Route path="transactions" element={<ClientTransactions />} />
              </Route>
              
              {/* Protected Routes - Lawyer Routes with Layout */}
              <Route path="/lawyer" element={
                <ProtectedRoute requiredRole="lawyer" checkApproval={true}>
                  <LawyerLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<LawyerDashboard />} />
                <Route path="cases" element={<LawyerCases />} />
                <Route path="clients" element={<LawyerClients />} />
                <Route path="chats" element={<Chat />} />
                <Route path="documents" element={<LawyerDocuments />} />
                <Route path="invoices" element={<LawyerInvoices />} />
                <Route path="profile" element={<LawyerProfile />} />
                <Route path="settings" element={<LawyerSettings />} />
              </Route>
              
              {/* 404 Page */}
              <Route path="/404" element={<NotFound />} />
              {/* Fallback: redirect to dashboard based on role if authenticated, else to 404 */}
              <Route path="*" element={<FallbackRedirect />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;