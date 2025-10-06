import React, { useEffect, useState } from 'react';
import { getClientCases, getClientStats } from '../services/api';

export default function ClientTransactions() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Use getClientStats to get summary data
        const statsData = await getClientStats();
        setSummary(statsData);
        
        // Extract transactions from cases or use stats data
        const casesData = await getClientCases();
        
        // Create mock transactions from cases data
        const mockTransactions = generateTransactionsFromCases(casesData);
        setTransactions(mockTransactions);
        
      } catch (err) {
        console.error('Error loading transactions:', err);
        setTransactions([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Generate transactions from cases data
  const generateTransactionsFromCases = (casesData) => {
    if (!Array.isArray(casesData)) return [];
    
    const transactions = [];
    casesData.forEach(caseItem => {
      if (caseItem.budget) {
        transactions.push({
          id: caseItem.id,
          created_at: caseItem.created_at,
          transaction_type: 'case_payment',
          amount: parseFloat(caseItem.budget),
          status: caseItem.status === 'resolved' || caseItem.status === 'closed' ? 'completed' : 'pending',
          transaction_number: `TXN-${caseItem.case_number || caseItem.id}`,
          case_title: caseItem.title
        });
      }
    });
    
    return transactions;
  };

  const calculateSummary = (transactions) => {
    const totalSpent = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const pendingPayments = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalSpent: `$${totalSpent.toFixed(2)}`,
      pendingPayments: `$${pendingPayments.toFixed(2)}`,
      completedCases: transactions.filter(t => t.status === 'completed').length,
      activeCases: transactions.filter(t => t.status === 'pending').length
    };
  };

  const displaySummary = summary || calculateSummary(transactions);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Transactions</h1>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-900">Loading transactions...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Summary Cards */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-blue-700 text-sm mb-2 font-semibold">Total Spent</h3>
              <p className="text-2xl font-bold text-blue-900">{displaySummary.totalSpent || '$0.00'}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-green-700 text-sm mb-2 font-semibold">Completed Cases</h3>
              <p className="text-2xl font-bold text-green-900">{displaySummary.completedCases || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <h3 className="text-yellow-700 text-sm mb-2 font-semibold">Pending Payments</h3>
              <p className="text-2xl font-bold text-yellow-900">{displaySummary.pendingPayments || '$0.00'}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-purple-700 text-sm mb-2 font-semibold">Active Cases</h3>
              <p className="text-2xl font-bold text-purple-900">{displaySummary.activeCases || 0}</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-blue-200 text-center">
              <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">No Transactions Found</h3>
              <p className="text-blue-700">Your transaction history will appear here once you make payments.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Date</th>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Type</th>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Case</th>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Amount</th>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Transaction #</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(txn => (
                        <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-700">
                            {txn.created_at ? new Date(txn.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-700 capitalize">
                            {txn.transaction_type?.replace('_', ' ') || 'Payment'}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {txn.case_title || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-semibold">
                            {typeof txn.amount === 'number' ? `$${txn.amount.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              txn.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {txn.status ? txn.status.charAt(0).toUpperCase() + txn.status.slice(1) : 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                            {txn.transaction_number || `TXN-${txn.id}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2"
                  onClick={() => alert('Export functionality coming soon!')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Transactions
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}