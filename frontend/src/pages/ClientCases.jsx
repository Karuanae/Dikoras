import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientCases, uploadDocumentWithFile, requestInvoice, exportTransactions, getClientStats } from '../services/api';

export default function ClientCases() {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [casesData, statsData] = await Promise.all([
          getClientCases(),
          getClientStats()
        ]);
        
        setCases(Array.isArray(casesData) ? casesData : []);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading cases:', err);
        setCases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter cases
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.legal_service?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || caseItem.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewDetails = (caseId) => {
    navigate(`/client/cases/${caseId}`);
  };

  const handlePostNewCase = () => {
    navigate('/client/cases/new');
  };

  const handleDocumentUpload = async (caseId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await uploadDocumentWithFile({ 
          case_id: caseId, 
          file,
          title: `Document for case ${caseId}`,
          document_type: 'case_file'
        });
        alert('Document uploaded successfully!');
      } catch (err) {
        alert('Upload failed: ' + (err.response?.data?.error || err.message));
      }
    };
    fileInput.click();
  };

  const handleRequestInvoice = async (caseId) => {
    const amount = prompt('Enter invoice amount:');
    const description = prompt('Enter invoice description:');
    if (!amount || !description) return;
    
    try {
      await requestInvoice({ 
        case_id: caseId, 
        amount: parseFloat(amount),
        description,
        due_days: 30
      });
      alert('Invoice requested successfully!');
    } catch (err) {
      alert('Invoice request failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleChat = (caseId) => {
    navigate('/client/chats', { state: { caseId } });
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: { color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡', label: 'Open' },
      assigned: { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔵', label: 'Assigned' },
      in_progress: { color: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-800', icon: '🟣', label: 'In Progress' },
      resolved: { color: 'from-green-500 to-green-600', bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Resolved' },
      closed: { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-800', icon: '🔒', label: 'Closed' }
    };
    return configs[status] || { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚪', label: status };
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { color: 'from-green-500 to-green-600', bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
      medium: { color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
      high: { color: 'from-orange-500 to-orange-600', bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
      urgent: { color: 'from-red-500 to-red-600', bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent' }
    };
    return configs[priority] || { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-800', label: priority };
  };

  const statusFilters = [
    { key: 'all', label: 'All Cases', count: cases.length },
    { key: 'open', label: 'Open', count: cases.filter(c => c.status === 'open').length },
    { key: 'assigned', label: 'Assigned', count: cases.filter(c => c.status === 'assigned').length },
    { key: 'in_progress', label: 'In Progress', count: cases.filter(c => c.status === 'in_progress').length },
    { key: 'resolved', label: 'Resolved', count: cases.filter(c => c.status === 'resolved').length },
    { key: 'closed', label: 'Closed', count: cases.filter(c => c.status === 'closed').length },
  ];

  const priorityFilters = [
    { key: 'all', label: 'All Priorities' },
    { key: 'low', label: 'Low' },
    { key: 'medium', label: 'Medium' },
    { key: 'high', label: 'High' },
    { key: 'urgent', label: 'Urgent' },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6 h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6 h-80"></div>
            ))}
          </div>
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
            My Legal Cases
          </h1>
          <p className="text-lg text-gray-600">
            Manage and track all your legal cases in one place
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={exportTransactions}
            className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export Data</span>
          </button>
          <button 
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-3"
            onClick={handlePostNewCase}
          >
            <span className="text-xl">➕</span>
            <span>Post New Case</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-blue-600 mb-2">{cases.length}</div>
          <div className="text-sm font-semibold text-gray-700">Total Cases</div>
          <div className="text-xs text-gray-500">All your legal matters</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {cases.filter(c => ['resolved', 'closed'].includes(c.status)).length}
          </div>
          <div className="text-sm font-semibold text-gray-700">Completed</div>
          <div className="text-xs text-gray-500">Successfully resolved</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-yellow-600 mb-2">
            {cases.filter(c => ['open', 'assigned', 'in_progress'].includes(c.status)).length}
          </div>
          <div className="text-sm font-semibold text-gray-700">Active</div>
          <div className="text-xs text-gray-500">Currently in progress</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            ${stats?.totalSpent || cases.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0).toFixed(2)}
          </div>
          <div className="text-sm font-semibold text-gray-700">Total Spent</div>
          <div className="text-xs text-gray-500">Legal services cost</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cases by title, case number, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {statusFilters.map((filterItem) => (
              <button
                key={filterItem.key}
                onClick={() => setFilterStatus(filterItem.key)}
                className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  filterStatus === filterItem.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterItem.label} ({filterItem.count})
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            {priorityFilters.map(filter => (
              <option key={filter.key} value={filter.key}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      {filteredCases.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚖️</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? 'No matching cases found' : 'No cases yet'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
              ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
              : 'Start your legal journey by posting your first case. Our lawyers are ready to help you!'
            }
          </p>
          <button 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            onClick={handlePostNewCase}
          >
            Get Started - Post Your First Case
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCases.map(caseItem => {
            const statusConfig = getStatusConfig(caseItem.status);
            const priorityConfig = getPriorityConfig(caseItem.priority);
            
            return (
              <div 
                key={caseItem.id}
                className="group bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Case Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-blue-700 transition-colors mb-3">
                      {caseItem.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                      {caseItem.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}>
                          {priorityConfig.label} Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Case Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Case #</span>
                    <span className="text-gray-900 font-medium">{caseItem.case_number}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Service</span>
                    <span className="text-gray-900 font-medium">{caseItem.legal_service?.name || caseItem.service_type || 'General'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Budget</span>
                    <span className="text-gray-900 font-medium">
                      {caseItem.budget ? `$${parseFloat(caseItem.budget).toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Deadline</span>
                    <span className="text-gray-900 font-medium">
                      {caseItem.deadline ? new Date(caseItem.deadline).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Lawyer</span>
                    <span className="text-gray-900 font-medium">
                      {caseItem.lawyer ? caseItem.lawyer.name || caseItem.lawyer.full_name : 'Not assigned'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold py-2 px-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => handleViewDetails(caseItem.id)}
                  >
                    View Details
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold py-2 px-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => handleChat(caseItem.id)}
                  >
                    💬 Chat
                  </button>
                  <button
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold py-2 px-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => handleDocumentUpload(caseItem.id)}
                  >
                    📎 Upload
                  </button>
                  <button
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold py-2 px-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => handleRequestInvoice(caseItem.id)}
                  >
                    💰 Invoice
                  </button>
                </div>

                {/* Timeline */}
                <div className="pt-4 border-t border-gray-200/50">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(caseItem.created_at).toLocaleDateString()}
                  </div>
                  {caseItem.updated_at && (
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(caseItem.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {filteredCases.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Showing {filteredCases.length} of {cases.length} cases
            {searchTerm && ` for "${searchTerm}"`}
            {filterStatus !== 'all' && ` in ${statusFilters.find(f => f.key === filterStatus)?.label}`}
            {filterPriority !== 'all' && ` with ${priorityFilters.find(f => f.key === filterPriority)?.label} priority`}
          </p>
        </div>
      )}
    </div>
  );
}