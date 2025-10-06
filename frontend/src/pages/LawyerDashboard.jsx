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
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        // Only call endpoints that exist - REMOVED getLawyerMessages
        const [casesData, clientsData] = await Promise.allSettled([
          getLawyerCases(),
          getLawyerClients()
        ]);
        
        // Handle cases data
        if (casesData.status === 'fulfilled') {
          const casesArray = Array.isArray(casesData.value) ? casesData.value : [];
          setCases(casesArray);
          console.log('Cases loaded:', casesArray.length, casesArray);
        } else {
          console.error('Error fetching cases:', casesData.reason);
          setCases([]);
        }
        
        // Handle clients data
        if (clientsData.status === 'fulfilled') {
          const clientsArray = Array.isArray(clientsData.value) ? clientsData.value : [];
          setClients(clientsArray.length);
        } else {
          console.error('Error fetching clients:', clientsData.reason);
          setClients(0);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Set empty states
        setCases([]);
        setClients(0);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleAddCase = () => {
    navigate('/lawyer/cases/new');
  };

  const handleManageClients = () => {
    navigate('/lawyer/clients');
  };

  // REMOVED: handleViewMessages since you don't have messages endpoint

  const handleViewChats = () => {
    navigate('/lawyer/chats'); // Or whatever your chat route is
  };

  const handleViewCases = () => {
    navigate('/lawyer/cases');
  };

  const handleViewProfile = () => {
    navigate('/lawyer/profile');
  };

  // New handlers for improvements
  const handleDocumentUpload = async (caseId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await uploadDocumentWithFile({ case_id: caseId, file });
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

  // Updated stats cards - REMOVED messages
  const stats = [
    { label: 'Total Cases', value: cases.length, color: 'blue' },
    { label: 'Active Clients', value: clients, color: 'green' },
    { label: 'Case Status', value: `${cases.filter(c => c.status === 'active').length} Active`, color: 'yellow' }
  ];

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-blue-700 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Lawyer Dashboard</h1>
          <p className="text-lg text-blue-700">Welcome to your dashboard. Here you can manage your cases, clients, and profile.</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2"
          onClick={handleViewProfile}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          View Profile
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-6`}>
            <div className="text-center">
              <div className={`text-3xl font-bold text-${stat.color}-900 mb-2`}>{stat.value}</div>
              <div className={`text-${stat.color}-700 font-medium`}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Cases Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-900">Recent Cases</h2>
          <span className="text-blue-700">Total: {cases.length} cases</span>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-blue-200 text-center">
            <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">No Cases Found</h3>
            <p className="text-blue-700 mb-4">Get started by adding your first case.</p>
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
              onClick={handleAddCase}
            >
              Add Your First Case
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.slice(0, 6).map(caseItem => (
              <div key={caseItem.id} className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-blue-900 truncate">{caseItem.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    caseItem.status === 'active' ? 'bg-green-100 text-green-800' :
                    caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    caseItem.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {caseItem.status?.charAt(0).toUpperCase() + caseItem.status?.slice(1) || 'Unknown'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Case #:</span>
                    <span className="text-blue-900 font-medium">{caseItem.case_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Service:</span>
                    <span className="text-blue-900">{caseItem.legal_service || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Priority:</span>
                    <span className="text-blue-900">{caseItem.priority || '-'}</span>
                  </div>
                  {caseItem.budget && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Budget:</span>
                      <span className="text-blue-900 font-medium">${caseItem.budget}</span>
                    </div>
                  )}
                  {caseItem.deadline && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Deadline:</span>
                      <span className="text-blue-900">{new Date(caseItem.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all duration-200"
                    onClick={() => handleDocumentUpload(caseItem.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Document
                  </button>
                  <button
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all duration-200"
                    onClick={() => handleRequestInvoice(caseItem.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5 5.5h.01M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-5l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Request Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl p-6 border border-blue-200">
        <h3 className="text-xl font-bold text-blue-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2"
            onClick={handleAddCase}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Case
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2"
            onClick={handleExportTransactions}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Transactions
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2"
            onClick={handleManageClients}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Manage Clients
          </button>
          {/* REMOVED: View Messages button since you don't have messages */}
          <button
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2"
            onClick={handleViewChats}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            View Chats
          </button>
          <button
            className="bg-blue-400 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2"
            onClick={handleViewCases}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View All Cases
          </button>
        </div>
      </div>
    </div>
  );
}