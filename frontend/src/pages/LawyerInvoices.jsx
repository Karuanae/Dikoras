import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerInvoices, createLawyerInvoice, sendInvoice } from '../services/api';

export default function LawyerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true);
        const data = await getLawyerInvoices();
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  // Filter and search invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesFilter = filter === 'all' || invoice.status === filter;
    const matchesSearch = invoice.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'sent')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const handleView = (invoice) => {
    navigate(`/lawyer/invoices/${invoice.id}`);
  };

  const handleDownload = (invoice) => {
    if (invoice.download_url) {
      window.open(invoice.download_url, '_blank');
    } else {
      // Generate download URL or show message
      alert('Download functionality coming soon!');
    }
  };

  const handleSendReminder = async (invoice) => {
    try {
      await sendInvoice(invoice.id);
      alert('Reminder sent successfully!');
      // Refresh invoices
      const data = await getLawyerInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      alert('Failed to send reminder: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateInvoice = () => {
    navigate('/lawyer/invoices/new');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return { bg: 'bg-green-100 text-green-800', badge: 'from-green-500 to-green-600', text: 'text-green-600' };
      case 'pending': return { bg: 'bg-yellow-100 text-yellow-800', badge: 'from-yellow-500 to-yellow-600', text: 'text-yellow-600' };
      case 'sent': return { bg: 'bg-blue-100 text-blue-800', badge: 'from-blue-500 to-blue-600', text: 'text-blue-600' };
      case 'overdue': return { bg: 'bg-red-100 text-red-800', badge: 'from-red-500 to-red-600', text: 'text-red-600' };
      default: return { bg: 'bg-gray-100 text-gray-800', badge: 'from-gray-500 to-gray-600', text: 'text-gray-600' };
    }
  };

  const statusFilters = [
    { key: 'all', label: 'All Invoices', count: invoices.length },
    { key: 'pending', label: 'Pending', count: invoices.filter(inv => inv.status === 'pending').length },
    { key: 'sent', label: 'Sent', count: invoices.filter(inv => inv.status === 'sent').length },
    { key: 'paid', label: 'Paid', count: invoices.filter(inv => inv.status === 'paid').length },
    { key: 'overdue', label: 'Overdue', count: invoices.filter(inv => inv.status === 'overdue').length },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6 h-32"></div>
            ))}
          </div>
          <div className="bg-gray-100 rounded-2xl p-6 h-64"></div>
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
            Invoice Management
          </h1>
          <p className="text-lg text-gray-600">
            Track and manage your legal service invoices
          </p>
        </div>
        
        <button
          onClick={handleCreateInvoice}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-3"
        >
          <span className="text-xl">➕</span>
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              💰
            </div>
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              +12%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">${totalRevenue.toFixed(2)}</div>
          <div className="text-sm font-semibold text-gray-700">Total Revenue</div>
          <div className="text-xs text-gray-500">All paid invoices</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600">
              ⏳
            </div>
            <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
              {invoices.filter(inv => inv.status === 'pending' || inv.status === 'sent').length}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">${pendingAmount.toFixed(2)}</div>
          <div className="text-sm font-semibold text-gray-700">Pending Amount</div>
          <div className="text-xs text-gray-500">Awaiting payment</div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              📊
            </div>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {invoices.length}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{invoices.length}</div>
          <div className="text-sm font-semibold text-gray-700">Total Invoices</div>
          <div className="text-xs text-gray-500">All time</div>
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
                placeholder="Search invoices by number, client, or description..."
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

      {/* Invoices Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📄</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No matching invoices found' : 'No invoices yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'Start billing your legal services by creating your first invoice. Track payments and manage client billing efficiently.'
              }
            </p>
            <button
              onClick={handleCreateInvoice}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Create Your First Invoice
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Invoice Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Due Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredInvoices.map(invoice => {
                    const statusColor = getStatusColor(invoice.status);
                    
                    return (
                      <tr 
                        key={invoice.id}
                        className="hover:bg-gray-50/50 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {invoice.number || `INV-${invoice.id}`}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {invoice.description || 'Legal Services'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'Date not set'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.client_name || invoice.client || 'Unknown Client'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {invoice.case_number ? `Case: ${invoice.case_number}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-gray-900">
                            ${parseFloat(invoice.amount || 0).toFixed(2)}
                          </div>
                          {invoice.tax_amount > 0 && (
                            <div className="text-sm text-gray-600">
                              +${parseFloat(invoice.tax_amount).toFixed(2)} tax
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}
                          </div>
                          {invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600 font-semibold mt-1">Overdue</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg}`}>
                            {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(invoice)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                            >
                              View
                            </button>
                            {invoice.status === 'paid' ? (
                              <button
                                onClick={() => handleDownload(invoice)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                              >
                                Download
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendReminder(invoice)}
                                className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors duration-200"
                              >
                                Remind
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Results Count */}
      {filteredInvoices.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
            {searchTerm && ` for "${searchTerm}"`}
            {filter !== 'all' && ` in ${statusFilters.find(f => f.key === filter)?.label}`}
          </p>
        </div>
      )}
    </div>
  );
}