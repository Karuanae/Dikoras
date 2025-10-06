import React, { useEffect, useState } from 'react';
import { getClientTransactionSummary, getClientTransactions } from '../services/api';

export default function ClientTransactions() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const summaryData = await getClientTransactionSummary();
        setSummary(summaryData);
        const transactionsData = await getClientTransactions();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } catch (err) {
        setTransactions([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Transactions</h1>
      {loading ? (
        <div className="text-blue-700">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Summary Cards */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="text-blue-700 text-sm mb-2">Total Spent</h3>
              <p className="text-2xl font-bold text-blue-900">{summary?.totalSpent ?? '-'}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="text-green-700 text-sm mb-2">Completed Cases</h3>
              <p className="text-2xl font-bold text-green-900">{summary?.completedCases ?? '-'}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="text-yellow-700 text-sm mb-2">Pending Payments</h3>
              <p className="text-2xl font-bold text-yellow-900">{summary?.pendingPayments ?? '-'}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="text-purple-700 text-sm mb-2">Active Cases</h3>
              <p className="text-2xl font-bold text-purple-900">{summary?.activeCases ?? '-'}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-2 text-left text-blue-900">Date</th>
                  <th className="px-4 py-2 text-left text-blue-900">Type</th>
                  <th className="px-4 py-2 text-left text-blue-900">Amount</th>
                  <th className="px-4 py-2 text-left text-blue-900">Status</th>
                  <th className="px-4 py-2 text-left text-blue-900">Transaction #</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-blue-700 text-center py-4">No transactions found.</td>
                  </tr>
                ) : (
                  transactions.map(txn => (
                    <tr key={txn.id} className="border-b border-blue-200">
                      <td className="px-4 py-3 text-blue-700">{txn.created_at ? new Date(txn.created_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-blue-700">{txn.transaction_type || '-'}</td>
                      <td className="px-4 py-3 text-blue-700">{typeof txn.amount === 'number' ? `$${txn.amount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-sm ${txn.status === 'completed' ? 'bg-green-100 text-green-800' : txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{txn.status ? txn.status.charAt(0).toUpperCase() + txn.status.slice(1) : '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-blue-700">{txn.transaction_number || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200">
              Export Transactions
            </button>
          </div>
        </>
      )}
    </>
  );
}