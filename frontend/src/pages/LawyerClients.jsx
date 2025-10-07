import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerClients } from '../services/api';

export default function LawyerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const clientsData = await getLawyerClients();
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setClients([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  // Filter and sort clients
  const filteredClients = clients
    .filter(client => 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'cases':
          return (b.total_cases || 0) - (a.total_cases || 0);
        case 'active':
          return (b.active_cases || 0) - (a.active_cases || 0);
        default:
          return 0;
      }
    });

  const handleContactClient = (client) => {
    const sharedCase = clients.find(c => c.id === client.id)?.cases?.[0];
    if (sharedCase) {
      navigate(`/chat?case_id=${sharedCase.id}`);
    } else {
      alert('No shared case found with this client. You need to have an assigned case to chat.');
    }
  };

  const handleViewClientDetails = (client) => {
    navigate(`/lawyer/clients/${client.id}`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (activeCases) => {
    if (activeCases > 3) return 'from-red-500 to-red-600';
    if (activeCases > 1) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-48 mb-6"></div>
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
            Client Portfolio
          </h1>
          <p className="text-lg text-gray-600">
            Manage relationships with your valued clients
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
            {clients.length} Total Clients
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {clients.length}
          </div>
          <div className="text-sm font-semibold text-gray-700">Total Clients</div>
          <div className="text-xs text-gray-500">All time relationships</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {clients.reduce((sum, client) => sum + (client.total_cases || 0), 0)}
          </div>
          <div className="text-sm font-semibold text-gray-700">Total Cases</div>
          <div className="text-xs text-gray-500">Across all clients</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {clients.reduce((sum, client) => sum + (client.active_cases || 0), 0)}
          </div>
          <div className="text-sm font-semibold text-gray-700">Active Cases</div>
          <div className="text-xs text-gray-500">Currently in progress</div>
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
                placeholder="Search clients by name, email, or phone..."
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

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="name">Sort by Name</option>
            <option value="cases">Sort by Total Cases</option>
            <option value="active">Sort by Active Cases</option>
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">👥</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchTerm ? 'No matching clients found' : 'No clients yet'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'Try adjusting your search terms to find the client you\'re looking for.'
              : 'Start building your client portfolio by taking on new cases. Clients will appear here once you\'re assigned to their matters.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map(client => {
            const avatarColor = getAvatarColor(client.name);
            const statusColor = getStatusColor(client.active_cases || 0);
            
            return (
              <div 
                key={client.id}
                className="group bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Client Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${avatarColor} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {getInitials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-700 transition-colors">
                      {client.name || 'Unnamed Client'}
                    </h3>
                    <p className="text-gray-600 text-sm truncate">{client.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${statusColor} text-white`}>
                        {client.active_cases || 0} Active
                      </span>
                      <span className="text-xs text-gray-500">
                        {client.total_cases || 0} Total Cases
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-500">📞</span>
                    <span className="text-gray-700">{client.phone || 'Phone not provided'}</span>
                  </div>
                  
                  {client.company && (
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-500">🏢</span>
                      <span className="text-gray-700">{client.company}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-500">📅</span>
                    <span className="text-gray-700">
                      Last contact: {client.last_contact ? new Date(client.last_contact).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleContactClient(client)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>💬</span>
                    <span>Contact</span>
                  </button>
                  <button
                    onClick={() => handleViewClientDetails(client)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>👁️</span>
                    <span>Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {filteredClients.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Showing {filteredClients.length} of {clients.length} clients
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
}