import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerCases } from '../services/api';

export default function LawyerCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true);
        const casesData = await getLawyerCases();
        setCases(Array.isArray(casesData) ? casesData : []);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setCases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  // Filter and search cases
  const filteredCases = cases.filter(caseItem => {
    const matchesFilter = filter === 'all' || caseItem.status === filter;
    const matchesSearch = caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleViewDetails = (caseId) => {
    navigate(`/lawyer/cases/${caseId}`);
  };

  const handleCreateCase = () => {
    navigate('/lawyer/cases/new');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: 'from-blue-500 to-blue-600', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
      case 'pending': return { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
      case 'completed': return { bg: 'from-green-500 to-green-600', text: 'text-green-700', badge: 'bg-green-100 text-green-800' };
      case 'closed': return { bg: 'from-gray-500 to-gray-600', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
      default: return { bg: 'from-blue-500 to-blue-600', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const statusFilters = [
    { key: 'all', label: 'All Cases', count: cases.length },
    { key: 'active', label: 'Active', count: cases.filter(c => c.status === 'active').length },
    { key: 'pending', label: 'Pending', count: cases.filter(c => c.status === 'pending').length },
    { key: 'completed', label: 'Completed', count: cases.filter(c => c.status === 'completed').length },
    { key: 'closed', label: 'Closed', count: cases.filter(c => c.status === 'closed').length },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-64 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6 h-64"></div>
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
        
        <button
          onClick={handleCreateCase}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-3"
        >
          <span className="text-xl">➕</span>
          <span>Create New Case</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statusFilters.map((filterItem) => (
          <div 
            key={filterItem.key}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 border border-gray-200/50 shadow-lg text-center"
          >
            <div className="text-2xl font-bold text-gray-900 mb-1">{filterItem.count}</div>
            <div className="text-sm text-gray-600 font-medium">{filterItem.label}</div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cases by title, case number, or client..."
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
                onClick={() => setFilter(filterItem.key)}
                className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  filter === filterItem.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterItem.label} ({filterItem.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      {filteredCases.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchTerm ? 'No matching cases found' : 'No cases yet'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
              : 'Start building your legal practice by creating your first case. Manage client matters and track your progress.'
            }
          </p>
          <button
            onClick={handleCreateCase}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Create Your First Case
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCases.map(caseItem => {
            const statusColor = getStatusColor(caseItem.status);
            const priorityColor = getPriorityColor(caseItem.priority);
            
            return (
              <div 
                key={caseItem.id}
                className="group bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Case Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate mb-2 group-hover:text-blue-700 transition-colors">
                      {caseItem.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor.badge}`}>
                        {caseItem.status?.charAt(0).toUpperCase() + caseItem.status?.slice(1) || 'Unknown'}
                      </span>
                      {caseItem.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColor}`}>
                          {caseItem.priority} Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Case Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Case Number</span>
                    <span className="text-sm font-semibold text-gray-900">{caseItem.case_number}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Client</span>
                    <span className="text-sm text-gray-900 truncate ml-2 max-w-[120px]">
                      {caseItem.client_name || caseItem.client || 'Not assigned'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service</span>
                    <span className="text-sm text-gray-900">{caseItem.legal_service || 'General Legal'}</span>
                  </div>

                  {caseItem.budget && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Budget</span>
                      <span className="text-sm font-semibold text-green-600">${caseItem.budget}</span>
                    </div>
                  )}

                  {caseItem.deadline && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Deadline</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(caseItem.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleViewDetails(caseItem.id)}
                  className={`w-full py-3 bg-gradient-to-r ${statusColor.bg} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2`}
                >
                  <span>{caseItem.status === 'pending' ? '👀' : '📋'}</span>
                  <span>{caseItem.status === 'pending' ? 'Review Case' : 'View Details'}</span>
                </button>
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
            {filter !== 'all' && ` in ${statusFilters.find(f => f.key === filter)?.label}`}
          </p>
        </div>
      )}
    </div>
  );
}