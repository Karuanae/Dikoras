import React, { useEffect, useState } from 'react';
import { getClientCases, requestInvoice } from '../services/api';

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    case_id: '',
    amount: '',
    description: '',
    due_days: 30
  });

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const casesData = await getClientCases();
        const casesArray = Array.isArray(casesData) ? casesData : [];
        setCases(casesArray);
        
        // Aggregate invoices from all cases
        let allInvoices = [];
        casesArray.forEach(c => {
          if (Array.isArray(c.invoices)) {
            allInvoices = allInvoices.concat(c.invoices.map(inv => ({
              ...inv,
              case_title: c.title,
              case_id: c.id,
              lawyer_name: c.lawyer?.name || c.lawyer?.full_name || 'Not assigned'
            })));
          }
        });
        
        // Sort by issue date (newest first)
        allInvoices.sort((a, b) => new Date(b.issue_date || b.created_at) - new Date(a.issue_date || a.created_at));
        setInvoices(allInvoices);
        
      } catch (err) {
        console.error('Error loading invoices:', err);
        setInvoices([]);
        setCases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch = inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.case_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleView = (invoice) => {
    const details = `
Invoice #: ${invoice.invoice_number}
Case: ${invoice.case_title}
Amount: $${invoice.total_amount?.toFixed(2) || invoice.amount?.toFixed(2) || '0.00'}
Status: ${invoice.status}
Issue Date: ${invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}
Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
Description: ${invoice.description || 'No description'}
    `;
    alert(details);
  };

  const handleDownload = (invoice) => {
    const downloadUrl = `http://localhost:5000/invoice/download/${invoice.id}`;
    window.open(downloadUrl, '_blank');
  };

  const handlePay = (invoice) => {
    alert(`Payment functionality for invoice ${invoice.invoice_number} would be implemented here.`);
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.case_id || !requestData.amount || !requestData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await requestInvoice({
        case_id: requestData.case_id,
        amount: parseFloat(requestData.amount),
        description: requestData.description,
        due_days: parseInt(requestData.due_days) || 30
      });

      // Refresh invoices
      const casesData = await getClientCases();
      let allInvoices = [];
      casesData.forEach(c => {
        if (Array.isArray(c.invoices)) {
          allInvoices = allInvoices.concat(c.invoices.map(inv => ({
            ...inv,
            case_title: c.title,
            case_id: c.id,
            lawyer_name: c.lawyer?.name || c.lawyer?.full_name || 'Not assigned'
          })));
        }
      });
      setInvoices(allInvoices);

      // Reset form and close modal
      setRequestData({
        case_id: '',
        amount: '',
        description: '',
        due_days: 30
      });
      setShowRequestModal(false);
      
      alert('Invoice requested successfully!');
    } catch (err) {
      alert('Invoice request failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      paid: { color: 'from-green-500 to-green-600', bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Paid' },
      sent: { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-800', icon: '📤', label: 'Sent' },
      pending: { color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Pending' },
      overdue: { color: 'from-red-500 to-red-600', bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️', label: 'Overdue' },
      draft: { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-800', icon: '📝', label: 'Draft' }
    };
    return configs[status] || { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-800', icon: '📄', label: status };
  };

  const calculateTotals = () => {
    const paid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || parseFloat(inv.amount) || 0), 0);
    const pending = invoices.filter(inv => ['sent', 'pending'].includes(inv.status)).reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || parseFloat(inv.amount) || 0), 0);
    const overdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || parseFloat(inv.amount) || 0), 0);
    
    return { paid, pending, overdue, total: paid + pending + overdue };
  };

  const totals = calculateTotals();

  const statusFilters = [
    { key: 'all', label: 'All Invoices', count: invoices.length },
    { key: 'paid', label: 'Paid', count: invoices.filter(inv => inv.status === 'paid').length },
    { key: 'sent', label: 'Sent', count: invoices.filter(inv => inv.status === 'sent').length },
    { key: 'pending', label: 'Pending', count: invoices.filter(inv => inv.status === 'pending').length },
    { key: 'overdue', label: 'Overdue', count: invoices.filter(inv => inv.status === 'overdue').length },
    { key: 'draft', label: 'Draft', count: invoices.filter(inv => inv.status === 'draft').length },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-2xl w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent mb-3">
            Invoice Management
          </h1>
          <p className="text-lg text-gray-600">
            Track and manage all your legal service invoices
          </p>
        </div>
        <button 
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowRequestModal(true)}
          disabled={cases.length === 0}
        >
          <span className="text-xl">➕</span>
          <span>Request Invoice</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-lg">
              ✅
            </div>
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Paid
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">${totals.paid.toFixed(2)}</div>
          <div className="text-sm font-semibold text-gray-700">Paid Amount</div>
          <div className="text-xs text-gray-500">Completed payments</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-lg">
              ⏳
            </div>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Pending
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">${totals.pending.toFixed(2)}</div>
          <div className="text-sm font-semibold text-gray-700">Pending Amount</div>
          <div className="text-xs text-gray-500">Awaiting payment</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 text-lg">
              ⚠️
            </div>
            <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              Overdue
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">${totals.overdue.toFixed(2)}</div>
          <div className="text-sm font-semibold text-gray-700">Overdue Amount</div>
          <div className="text-xs text-gray-500">Past due date</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-lg">
              💰
            </div>
            <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">${totals.total.toFixed(2)}</div>
          <div className="text-sm font-semibold text-gray-700">Total Amount</div>
          <div className="text-xs text-gray-500">All invoices</div>
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
                placeholder="Search invoices by number, case, or description..."
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
                onClick={() => setStatusFilter(filterItem.key)}
                className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  statusFilter === filterItem.key
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
      {filteredInvoices.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🧾</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchTerm || statusFilter !== 'all' ? 'No matching invoices found' : 'No invoices yet'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {invoices.length === 0 
              ? "You don't have any invoices yet. Invoices will appear here once they are generated for your cases."
              : "No invoices match your current filter. Try selecting a different status or search term."
            }
          </p>
          {cases.length === 0 ? (
            <p className="text-orange-600 font-medium">You need to have at least one case to request invoices.</p>
          ) : (
            <button 
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => setShowRequestModal(true)}
            >
              Request Your First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Invoice Details</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Case</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Dates</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredInvoices.map(invoice => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const isOverdue = invoice.status === 'overdue' || 
                    (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid');
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {invoice.invoice_number}
                          </div>
                          {invoice.description && (
                            <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {invoice.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.case_title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {invoice.lawyer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '-'}
                        </div>
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-gray-900">
                          ${(invoice.total_amount || invoice.amount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                            onClick={() => handleView(invoice)}
                          >
                            View
                          </button>
                          {invoice.status === 'paid' ? (
                            <button 
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                              onClick={() => handleDownload(invoice)}
                            >
                              Download
                            </button>
                          ) : (
                            <button 
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                              onClick={() => handlePay(invoice)}
                            >
                              Pay Now
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
        </div>
      )}

      {/* Results Count */}
      {filteredInvoices.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
            {searchTerm && ` for "${searchTerm}"`}
            {statusFilter !== 'all' && ` in ${statusFilters.find(f => f.key === statusFilter)?.label}`}
          </p>
        </div>
      )}

      {/* Request Invoice Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-gray-200/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Request Invoice
              </h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="space-y-6">
              <div>
                <label className="block font-semibold text-gray-700 mb-3">Select Case *</label>
                <select
                  name="case_id"
                  value={requestData.case_id}
                  onChange={handleRequestChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                >
                  <option value="">Choose a case</option>
                  {cases.map(caseItem => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.title} - {caseItem.case_number}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-semibold text-gray-700 mb-3">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={requestData.amount}
                  onChange={handleRequestChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block font-semibold text-gray-700 mb-3">Description *</label>
                <textarea
                  name="description"
                  value={requestData.description}
                  onChange={handleRequestChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  rows="3"
                  placeholder="Describe the services or work being invoiced..."
                  required
                />
              </div>
              
              <div>
                <label className="block font-semibold text-gray-700 mb-3">Due Days</label>
                <input
                  type="number"
                  name="due_days"
                  value={requestData.due_days}
                  onChange={handleRequestChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  min="1"
                  max="90"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 font-semibold"
                >
                  Request Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}