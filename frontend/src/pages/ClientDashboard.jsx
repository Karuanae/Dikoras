import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getClientCases,
  getClientStats,
  getClientNotifications,
  getUserFromStorage
} from '../services/api';

export default function ClientDashboard() {
  const [activeCases, setActiveCases] = useState(0);
  const [lawyersHired, setLawyersHired] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [cases, setCases] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const [casesData, statsData, notificationsData] = await Promise.all([
          getClientCases().catch(err => { console.error('Cases error:', err); return []; }),
          getClientStats().catch(err => { console.error('Stats error:', err); return {}; }),
          getClientNotifications().catch(err => { console.error('Notifications error:', err); return []; })
        ]);
        
        // Process cases data
        const casesArray = Array.isArray(casesData) ? casesData : [];
        setCases(casesArray);
        
        const activeCount = casesArray.filter(c => 
          ['active', 'open', 'assigned', 'in_progress'].includes(c.status)
        ).length;
        setActiveCases(activeCount);
        
        const lawyersCount = new Set(casesArray.filter(c => c.lawyer_id).map(c => c.lawyer_id)).size;
        setLawyersHired(lawyersCount);

        // Process notifications
        const unreadCount = Array.isArray(notificationsData) ? 
          notificationsData.filter(n => !n.is_read).length : 0;
        setUnreadNotifications(unreadCount);

        // Process stats and extract data
        setSummary(statsData);
        
        // Extract recent documents from cases
        const allDocs = [];
        casesArray.forEach(caseItem => {
          if (caseItem.documents && Array.isArray(caseItem.documents)) {
            allDocs.push(...caseItem.documents.map(doc => ({
              ...doc,
              case_title: caseItem.title
            })));
          }
        });
        setRecentDocs(allDocs.slice(0, 3));

        // Extract recent invoices from cases
        const allInvoices = [];
        casesArray.forEach(caseItem => {
          if (caseItem.invoices && Array.isArray(caseItem.invoices)) {
            allInvoices.push(...caseItem.invoices.map(inv => ({
              ...inv,
              case_title: caseItem.title
            })));
          }
        });
        setRecentInvoices(allInvoices.slice(0, 3));

        // Extract recent transactions
        if (statsData.recentTransactions) {
          setRecentTransactions(statsData.recentTransactions.slice(0, 3));
        } else {
          const transactions = casesArray
            .filter(c => c.budget)
            .map(c => ({
              id: c.id,
              transaction_number: `TXN-${c.case_number || c.id}`,
              amount: parseFloat(c.budget),
              status: ['resolved', 'closed'].includes(c.status) ? 'completed' : 'pending',
              case_title: c.title
            }));
          setRecentTransactions(transactions.slice(0, 3));
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
  };

  const handleFindLawyers = () => {
    navigate('/lawyers-directory');
  };

  const handleQuickAction = (path) => {
    navigate(path);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'from-yellow-500 to-yellow-600' },
      assigned: { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'from-blue-500 to-blue-600' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', badge: 'from-purple-500 to-purple-600' },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', badge: 'from-green-500 to-green-600' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'from-gray-500 to-gray-600' },
      active: { bg: 'bg-green-100', text: 'text-green-800', badge: 'from-green-500 to-green-600' }
    };
    return colors[status] || colors.closed;
  };

  const quickActions = [
    {
      name: 'Post New Case',
      description: 'Start a new legal case',
      icon: '📝',
      path: '/client/cases/new',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      name: 'View Messages',
      description: `${unreadNotifications} unread messages`,
      icon: '💬',
      path: '/client/chats',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      name: 'Documents',
      description: `${recentDocs.length} recent files`,
      icon: '📁',
      path: '/client/documents',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      name: 'Invoices',
      description: `${recentInvoices.length} recent bills`,
      icon: '🧾',
      path: '/client/invoices',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6 h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-gray-100 rounded-2xl p-6 h-64"></div>
            <div className="bg-gray-100 rounded-2xl p-6 h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  const user = getUserFromStorage();

  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent mb-3">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Welcome to Dikoras! The easiest solution for cost-effective, high-quality legal services. 
            Manage your cases, communicate with lawyers, and track everything in one place.
          </p>
        </div>
        
        <button
          onClick={handlePostCase}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-3"
        >
          <span className="text-xl">🚀</span>
          <span>Post New Case</span>
        </button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-lg">
              ⚖️
            </div>
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +5%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{activeCases}</div>
          <div className="text-sm font-semibold text-gray-700">Active Cases</div>
          <div className="text-xs text-gray-500">Currently in progress</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-lg">
              👨‍⚖️
            </div>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {lawyersHired}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{lawyersHired}</div>
          <div className="text-sm font-semibold text-gray-700">Lawyers Hired</div>
          <div className="text-xs text-gray-500">Working with you</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-lg">
              💬
            </div>
            <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {unreadNotifications}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{unreadNotifications}</div>
          <div className="text-sm font-semibold text-gray-700">Unread Messages</div>
          <div className="text-xs text-gray-500">Awaiting your response</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-lg">
              💰
            </div>
            <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {summary?.totalSpent ? `$${summary.totalSpent}` : '$0'}
          </div>
          <div className="text-sm font-semibold text-gray-700">Total Spent</div>
          <div className="text-xs text-gray-500">All legal services</div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <div 
                key={index}
                onClick={() => handleQuickAction(action.path)}
                className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl ${action.bgColor} flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{action.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {cases.slice(0, 4).map(caseItem => {
              const statusColor = getStatusColor(caseItem.status);
              return (
                <div key={caseItem.id} className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/30">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${statusColor.badge}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {caseItem.title}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {caseItem.status?.replace('_', ' ')} • {caseItem.legal_service?.name || 'Case'}
                    </p>
                  </div>
                </div>
              );
            })}
            {cases.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Cases Section */}
      {cases.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Recent Cases</h2>
                <p className="text-gray-600">Latest legal matters and their status</p>
              </div>
              <button 
                onClick={handleViewCases}
                className="mt-4 lg:mt-0 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                View All Cases
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.slice(0, 3).map(caseItem => {
                const statusColor = getStatusColor(caseItem.status);
                return (
                  <div 
                    key={caseItem.id}
                    className="group bg-white rounded-2xl border border-gray-200/70 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-2 flex-1 group-hover:text-blue-700 transition-colors">
                        {caseItem.title}
                      </h3>
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                        {caseItem.status?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-sm text-gray-600 mb-6">
                      <div className="flex justify-between items-center">
                        <span>Case #</span>
                        <span className="text-gray-900 font-medium">{caseItem.case_number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Service</span>
                        <span className="text-gray-900 font-medium">
                          {caseItem.legal_service?.name || caseItem.service_type || 'General'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Lawyer</span>
                        <span className="text-gray-900 font-medium">
                          {caseItem.lawyer ? caseItem.lawyer.name || caseItem.lawyer.full_name : 'Not assigned'}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/client/cases/${caseItem.id}`)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      View Case Details
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="relative text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Legal Help?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Post your case today and get free proposals from qualified lawyers. 
            It only takes a minute and your information is strictly confidential.
          </p>
          <button 
            onClick={handlePostCase}
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 text-lg flex items-center space-x-3 mx-auto"
          >
            <span>🚀</span>
            <span>Post a Case & Get Free Proposals</span>
          </button>
        </div>
      </div>
    </div>
  );
}