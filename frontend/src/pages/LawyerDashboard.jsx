import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLawyerCases,
  getLawyerClients,
  uploadDocumentWithFile,
  requestInvoice,
  exportTransactions
} from '../services/api';

export default function LawyerDashboard() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        const [casesData, clientsData] = await Promise.allSettled([
          getLawyerCases(),
          getLawyerClients()
        ]);
        
        if (casesData.status === 'fulfilled') {
          const casesArray = Array.isArray(casesData.value) ? casesData.value : [];
          setCases(casesArray);
        } else {
          console.error('Error fetching cases:', casesData.reason);
          setCases([]);
        }
        
        if (clientsData.status === 'fulfilled') {
          const clientsArray = Array.isArray(clientsData.value) ? clientsArray.value : [];
          setClients(clientsArray.length);
        } else {
          console.error('Error fetching clients:', clientsData.reason);
          setClients(0);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setCases([]);
        setClients(0);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Enhanced stats with better calculations
  const activeCases = cases.filter(c => c.status === 'active' || c.status === 'in_progress').length;
  const pendingCases = cases.filter(c => c.status === 'pending').length;
  const completedCases = cases.filter(c => c.status === 'completed' || c.status === 'closed').length;

  const stats = [
    { 
      label: 'Total Cases', 
      value: cases.length, 
      change: '+12%', 
      icon: '📁',
      color: 'blue',
      description: 'All assigned cases'
    },
    { 
      label: 'Active Clients', 
      value: clients, 
      change: '+5%', 
      icon: '👥',
      color: 'green',
      description: 'Current clients'
    },
    { 
      label: 'Active Cases', 
      value: activeCases, 
      change: '+8%', 
      icon: '⚡',
      color: 'yellow',
      description: 'In progress'
    },
    { 
      label: 'Completed', 
      value: completedCases, 
      change: '+15%', 
      icon: '✅',
      color: 'purple',
      description: 'Resolved cases'
    }
  ];

  const quickActions = [
    {
      name: 'Add New Case',
      icon: '➕',
      description: 'Create new legal case',
      action: () => navigate('/lawyer/cases/new'),
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600'
    },
    {
      name: 'Manage Clients',
      icon: '👥',
      description: 'View all clients',
      action: () => navigate('/lawyer/clients'),
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-600'
    },
    {
      name: 'View Chats',
      icon: '💬',
      description: 'Client communications',
      action: () => navigate('/lawyer/chats'),
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-gradient-to-r from-purple-500 to-indigo-600'
    },
    {
      name: 'Documents',
      icon: '📄',
      description: 'Legal documents',
      action: () => navigate('/lawyer/documents'),
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-600'
    }
  ];

  const handleDocumentUpload = async (caseId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await uploadDocumentWithFile({ case_id: caseId, file });
        // Show success notification
        alert('Document uploaded successfully!');
      } catch (err) {
        alert('Upload failed: ' + (err.response?.data?.error || err.message));
      }
    };
    fileInput.click();
  };

  const handleRequestInvoice = async (caseId) => {
    const amount = prompt('Enter invoice amount:');
    if (!amount) return;
    
    const description = prompt('Enter invoice description:');
    if (!description) return;

    try {
      await requestInvoice({ case_id: caseId, amount: parseFloat(amount), description });
      alert('Invoice requested successfully!');
    } catch (err) {
      alert('Invoice request failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExportTransactions = async () => {
    try {
      await exportTransactions();
      alert('Transactions export initiated!');
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">Loading your legal dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent mb-3">
            Lawyer Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Welcome back! Here's an overview of your legal practice, cases, and client interactions.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportTransactions}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>📊</span>
            <span>Export Data</span>
          </button>
          <button
            onClick={() => navigate('/lawyer/profile')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>👤</span>
            <span>View Profile</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${stat.color === 'blue' ? 'from-blue-500 to-blue-600' : stat.color === 'green' ? 'from-green-500 to-green-600' : stat.color === 'yellow' ? 'from-yellow-500 to-yellow-600' : 'from-purple-500 to-purple-600'} flex items-center justify-center text-white text-lg`}>
                {stat.icon}
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group text-left bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl ${action.bgColor} flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{action.name}</h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Cases Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Cases</h2>
              <p className="text-gray-600">Your most recent legal cases and matters</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {cases.length} Total Cases
              </span>
              <button
                onClick={() => navigate('/lawyer/cases')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                View All
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📁</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Cases Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start building your legal practice by adding your first case. Manage client matters, track progress, and deliver exceptional service.
              </p>
              <button
                onClick={() => navigate('/lawyer/cases/new')}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Add Your First Case
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cases.slice(0, 6).map(caseItem => (
                <div 
                  key={caseItem.id}
                  className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1"
                >
                  {/* Case Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900 text-lg truncate flex-1 mr-3">
                      {caseItem.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      caseItem.status === 'active' ? 'bg-green-100 text-green-800' :
                      caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      caseItem.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {caseItem.status?.charAt(0).toUpperCase() + caseItem.status?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                  
                  {/* Case Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Case #</span>
                      <span className="text-sm font-semibold text-gray-900">{caseItem.case_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Service</span>
                      <span className="text-sm text-gray-900">{caseItem.legal_service || 'General'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Priority</span>
                      <span className={`text-sm font-semibold ${
                        caseItem.priority === 'high' ? 'text-red-600' :
                        caseItem.priority === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {caseItem.priority || 'Normal'}
                      </span>
                    </div>
                    {caseItem.budget && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="text-sm font-semibold text-gray-900">${caseItem.budget}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDocumentUpload(caseItem.id)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-1"
                    >
                      <span>📎</span>
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={() => handleRequestInvoice(caseItem.id)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-1"
                    >
                      <span>💰</span>
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}