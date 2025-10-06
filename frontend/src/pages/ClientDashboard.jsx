import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getClientCases,
  getClientStats,
  getClientNotifications,
  getUserFromStorage
} from '../services/api';

// Client Dashboard Component
export default function ClientDashboard() {
  const [activeCases, setActiveCases] = useState(0);
  const [lawyersHired, setLawyersHired] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [cases, setCases] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch cases
        const casesData = await getClientCases();
        const casesArray = Array.isArray(casesData) ? casesData : [];
        setCases(casesArray);
        
        // Calculate active cases and lawyers hired
        const activeCount = casesArray.filter(c => 
          c.status === 'active' || 
          c.status === 'open' || 
          c.status === 'assigned' || 
          c.status === 'in_progress'
        ).length;
        setActiveCases(activeCount);
        
        const lawyersCount = casesArray.filter(c => c.lawyer_id).length;
        setLawyersHired(lawyersCount);

        // Fetch unread notifications instead of messages
        try {
          const notifications = await getClientNotifications();
          const unreadCount = Array.isArray(notifications) ? 
            notifications.filter(n => !n.is_read).length : 0;
          setUnreadNotifications(unreadCount);
        } catch (error) {
          console.warn('Could not fetch notifications:', error);
          setUnreadNotifications(0);
        }

        // Fetch client stats which should include summary data
        try {
          const statsData = await getClientStats();
          setSummary(statsData);
          
          // Extract recent documents and invoices from stats if available
          if (statsData.recentDocuments) {
            setRecentDocs(Array.isArray(statsData.recentDocuments) ? statsData.recentDocuments.slice(0, 3) : []);
          }
          if (statsData.recentInvoices) {
            setRecentInvoices(Array.isArray(statsData.recentInvoices) ? statsData.recentInvoices.slice(0, 3) : []);
          }
        } catch (error) {
          console.warn('Could not fetch stats:', error);
          setSummary(null);
          setRecentDocs([]);
          setRecentInvoices([]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePostCase = () => {
    navigate('/client/cases/new');
  };

  const handleViewCases = () => {
    navigate('/client/cases');
  };

  const handleViewMessages = () => {
    navigate('/client/chats');
    setUnreadNotifications(0);
  };

  const handleFindLawyers = () => {
    navigate('/lawyers-directory');
  };

  const handleHireLawyer = async (caseId) => {
    try {
      // Since updateCase doesn't exist, we'll navigate to the case details
      // where the user can hire a lawyer from there
      navigate(`/client/cases/${caseId}`);
    } catch (err) {
      console.error('Error navigating to case:', err);
      alert('Failed to open case details. Please try again.');
    }
  };

  // Quick links
  const handleViewDocuments = () => navigate('/client/documents');
  const handleViewInvoices = () => navigate('/client/invoices');
  const handleViewTransactions = () => navigate('/client/transactions');

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-900">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Dashboard</h1>
      <p className="text-lg text-blue-700 mb-6">Welcome to Dikoras! Dikoras is the easiest solution for any client to get cost-effective and high quality legal services.</p>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">{activeCases}</span>
          <span className="text-blue-900 font-semibold">Active Cases</span>
          <button onClick={handleViewCases} className="mt-2 text-blue-600 text-sm hover:underline">View All</button>
        </div>
        <div className="bg-green-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-green-700 mb-2">{lawyersHired}</span>
          <span className="text-green-900 font-semibold">Lawyers Hired</span>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-yellow-700 mb-2">{unreadNotifications}</span>
          <span className="text-yellow-900 font-semibold">Unread Notifications</span>
          <button onClick={handleViewMessages} className="mt-2 text-yellow-600 text-sm hover:underline">View Messages</button>
        </div>
        <div className="bg-purple-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-purple-700 mb-2">
            {summary?.totalSpent ? `$${summary.totalSpent}` : '$0'}
          </span>
          <span className="text-purple-900 font-semibold">Total Spent</span>
          <button onClick={handleViewTransactions} className="mt-2 text-purple-600 text-sm hover:underline">View Transactions</button>
        </div>
      </div>
      
      {/* Quick Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Recent Documents</h2>
          {recentDocs.length === 0 ? (
            <span className="text-blue-700">No documents found.</span>
          ) : (
            recentDocs.map((doc, index) => (
              <div key={index} className="mb-2 flex justify-between items-center">
                <span className="text-blue-700 truncate">{doc.title || `Document ${index + 1}`}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm" onClick={handleViewDocuments}>View</button>
              </div>
            ))
          )}
          <button className="mt-2 text-blue-600 text-sm hover:underline" onClick={handleViewDocuments}>View All Documents</button>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Recent Invoices</h2>
          {recentInvoices.length === 0 ? (
            <span className="text-blue-700">No invoices found.</span>
          ) : (
            recentInvoices.map((inv, index) => (
              <div key={index} className="mb-2 flex justify-between items-center">
                <span className="text-blue-700">Invoice #{inv.invoice_number || inv.id || index + 1}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm" onClick={handleViewInvoices}>View</button>
              </div>
            ))
          )}
          <button className="mt-2 text-blue-600 text-sm hover:underline" onClick={handleViewInvoices}>View All Invoices</button>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Recent Transactions</h2>
          {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
            summary.recentTransactions.slice(0, 3).map((txn, index) => (
              <div key={index} className="mb-2 flex justify-between items-center">
                <span className="text-blue-700">Txn #{txn.transaction_number || txn.id || index + 1}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm" onClick={handleViewTransactions}>View</button>
              </div>
            ))
          ) : (
            <span className="text-blue-700">No transactions found.</span>
          )}
          <button className="mt-2 text-blue-600 text-sm hover:underline" onClick={handleViewTransactions}>View All Transactions</button>
        </div>
      </div>
      
      {/* Recent Cases Section */}
      {cases.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Your Recent Cases</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-3 text-left text-blue-900">Case Title</th>
                  <th className="p-3 text-left text-blue-900">Type</th>
                  <th className="p-3 text-left text-blue-900">Status</th>
                  <th className="p-3 text-left text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 3).map(caseItem => (
                  <tr key={caseItem.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{caseItem.title}</td>
                    <td className="p-3">{caseItem.legal_service || caseItem.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        caseItem.status === 'active' || caseItem.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        caseItem.status === 'assigned' || caseItem.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        caseItem.status === 'resolved' || caseItem.status === 'closed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {caseItem.status?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => navigate(`/client/cases/${caseItem.id}`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleViewCases} className="text-blue-600 hover:text-blue-800 font-medium">View All Cases →</button>
          </div>
        </div>
      )}
      
      {/* Action Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Post a Case */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Post a Case" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Post a Case</h2>
            <p className="text-blue-700 text-sm">Get started by telling us about your legal needs. It only takes a minute and your information is strictly confidential.</p>
            <button onClick={handlePostCase} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded">Post a Case</button>
          </div>
        </div>
        {/* Get Proposals */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921223.png" alt="Get Proposals" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Get Proposals</h2>
            <p className="text-blue-700 text-sm">Our algorithm matches you with attorneys most qualified to handle your specific legal work. Review proposals and schedule free consultations.</p>
            <button onClick={handleViewCases} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded">View Proposals</button>
          </div>
        </div>
        {/* Hire your Lawyer */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow md:col-span-2">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921224.png" alt="Hire your Lawyer" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Hire your Lawyer</h2>
            <p className="text-blue-700 text-sm">When you're ready, instantly hire the attorney that's right for you.</p>
            <div className="flex space-x-2 mt-2">
              <button onClick={handleFindLawyers} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded">Find Lawyers</button>
              <button onClick={handleViewMessages} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded">Message Lawyers</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <button onClick={handlePostCase} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200">Post a Case & Get Free Proposals</button>
      </div>
    </div>
  );
}