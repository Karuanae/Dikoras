import React, { useEffect, useState } from 'react';
import { getClientCases, getClientStats, exportTransactions } from '../services/api';

export default function ClientTransactions() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [casesData, statsData] = await Promise.all([
          getClientCases().catch(err => { console.error('Cases error:', err); return []; }),
          getClientStats().catch(err => { console.error('Stats error:', err); return {}; })
        ]);
        
        setSummary(statsData);
        
        // Create comprehensive transactions from cases data
        const allTransactions = [];
        const casesArray = Array.isArray(casesData) ? casesData : [];
        
        casesArray.forEach(caseItem => {
          // Add case budget as a transaction
          if (caseItem.budget) {
            allTransactions.push({
              id: `case-${caseItem.id}`,
              created_at: caseItem.created_at,
              transaction_type: 'case_payment',
              amount: parseFloat(caseItem.budget),
              status: ['resolved', 'closed'].includes(caseItem.status) ? 'completed' : 'pending',
              transaction_number: `TXN-CASE-${caseItem.case_number || caseItem.id}`,
              case_title: caseItem.title,
              description: `Payment for ${caseItem.title}`,
              payment_method: 'platform',
              case_id: caseItem.id
            });
          }
          
          // Add invoices as transactions
          if (caseItem.invoices && Array.isArray(caseItem.invoices)) {
            caseItem.invoices.forEach(invoice => {
              allTransactions.push({
                id: `invoice-${invoice.id}`,
                created_at: invoice.issue_date || caseItem.created_at,
                transaction_type: 'invoice_payment',
                amount: parseFloat(invoice.total_amount || invoice.amount || 0),
                status: invoice.status === 'paid' ? 'completed' : 
                       invoice.status === 'overdue' ? 'failed' : 'pending',
                transaction_number: invoice.invoice_number || `INV-${invoice.id}`,
                case_title: caseItem.title,
                description: `Invoice payment for ${caseItem.title}`,
                payment_method: 'platform',
                case_id: caseItem.id,
                invoice_id: invoice.id
              });
            });
          }
        });
        
        // Sort by date (newest first)
        allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        
      } catch (err) {
        console.error('Error loading transactions:', err);
        setTransactions([]);
        setFilteredTransactions([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(t => new Date(t.created_at).toDateString() === now.toDateString());
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(t => new Date(t.created_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(t => new Date(t.created_at) >= filterDate);
          break;
        default:
          break;
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.case_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  }, [statusFilter, dateFilter, searchTerm, transactions]);

  const calculateSummary = () => {
    const completed = transactions.filter(t => t.status === 'completed');
    const pending = transactions.filter(t => t.status === 'pending');
    
    return {
      totalSpent: completed.reduce((sum, t) => sum + (t.amount || 0), 0),
      pendingPayments: pending.reduce((sum, t) => sum + (t.amount || 0), 0),
      completedTransactions: completed.length,
      pendingTransactions: pending.length,
      totalTransactions: transactions.length
    };
  };

  const displaySummary = summary || calculateSummary();

  const handleExport = async () => {
    try {
      await exportTransactions();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export functionality is not available yet.');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: { color: 'from-green-500 to-green-600', bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      pending: { color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      failed: { color: 'from-red-500 to-red-600', bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    };
    return configs[status] || { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  };

  const getTypeConfig = (type) => {
    const configs = {
      case_payment: { icon: '⚖️', label: 'Case Payment', color: 'from-blue-500 to-blue-600' },
      invoice_payment: { icon: '🧾', label: 'Invoice Payment', color: 'from-purple-500 to-purple-600' },
      refund: { icon: '↩️', label: 'Refund', color: 'from-orange-500 to-orange-600' }
    };
    return configs[type] || { icon: '💳', label: 'Payment', color: 'from-gray-500 to-gray-600' };
  };

  const statusFilters = [
    { key: 'all', label: 'All Status', count: transactions.length },
    { key: 'completed', label: 'Completed', count: transactions.filter(t => t.status === 'completed').length },
    { key: 'pending', label: 'Pending', count: transactions.filter(t => t.status === 'pending').length },
    { key: 'failed', label: 'Failed', count: transactions.filter(t => t.status === 'failed').length },
  ];

  const dateFilters = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
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
            Transaction History
          </h1>
          <p className="text-lg text-gray-600">
            Track all your payments and financial activities
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
        >
          <span>📊</span>
          <span>Export Transactions</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-lg">
              💰
            </div>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${displaySummary.totalSpent?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm font-semibold text-gray-700">Total Spent</div>
          <div className="text-xs text-gray-500">All completed payments</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-lg">
              ✅
            </div>
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {displaySummary.completedTransactions || 0}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{displaySummary.completedTransactions || 0}</div>
          <div className="text-sm font-semibold text-gray-700">Completed</div>
          <div className="text-xs text-gray-500">Successful transactions</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 text-lg">
              ⏳
            </div>
            <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              ${displaySummary.pendingPayments?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">${displaySummary.pendingPayments?.toFixed(2) || '0.00'}</div>
          <div className="text-sm font-semibold text-gray-700">Pending</div>
          <div className="text-xs text-gray-500">Awaiting completion</div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-lg">
              📈
            </div>
            <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {displaySummary.totalTransactions || 0}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{displaySummary.totalTransactions || 0}</div>
          <div className="text-sm font-semibold text-gray-700">Total</div>
          <div className="text-xs text-gray-500">All transactions</div>
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
                placeholder="Search transactions by reference, case, or description..."
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

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            {dateFilters.map(filter => (
              <option key={filter.key} value={filter.key}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💳</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'No matching transactions found' : 'No transactions yet'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {transactions.length === 0 
              ? "You haven't made any transactions yet. Your transaction history will appear here once you start making payments."
              : "No transactions match your current filters. Try adjusting your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Transaction Details</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Case</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredTransactions.map(txn => {
                  const statusConfig = getStatusConfig(txn.status);
                  const typeConfig = getTypeConfig(txn.transaction_type);
                  
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${typeConfig.color} flex items-center justify-center text-white text-lg`}>
                            {typeConfig.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {txn.transaction_number || `REF-${txn.id}`}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {txn.description || 'Payment transaction'}
                            </div>
                            <div className="text-xs text-gray-500 capitalize mt-1">
                              {typeConfig.label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {txn.case_title || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-gray-900">
                          ${typeof txn.amount === 'number' ? txn.amount.toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {txn.created_at ? new Date(txn.created_at).toLocaleDateString() : '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {txn.created_at ? new Date(txn.created_at).toLocaleTimeString() : ''}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200/50">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0">
              <div className="text-sm text-gray-600">
                Showing {filteredTransactions.length} of {transactions.length} transactions
                {searchTerm && ` for "${searchTerm}"`}
                {statusFilter !== 'all' && ` in ${statusFilters.find(f => f.key === statusFilter)?.label}`}
                {dateFilter !== 'all' && ` from ${dateFilters.find(f => f.key === dateFilter)?.label}`}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                Total: ${filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}