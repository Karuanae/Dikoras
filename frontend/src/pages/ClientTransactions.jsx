import React from 'react';

export default function ClientTransactions() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Transactions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Summary Cards */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="text-blue-700 text-sm mb-2">Total Spent</h3>
          <p className="text-2xl font-bold text-blue-900">$1,250.00</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <h3 className="text-green-700 text-sm mb-2">Completed Cases</h3>
          <p className="text-2xl font-bold text-green-900">8</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <h3 className="text-yellow-700 text-sm mb-2">Pending Payments</h3>
          <p className="text-2xl font-bold text-yellow-900">$150.00</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <h3 className="text-purple-700 text-sm mb-2">Active Cases</h3>
          <p className="text-2xl font-bold text-purple-900">3</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-4 py-2 text-left text-blue-900">Date</th>
              <th className="px-4 py-2 text-left text-blue-900">Description</th>
              <th className="px-4 py-2 text-left text-blue-900">Amount</th>
              <th className="px-4 py-2 text-left text-blue-900">Status</th>
              <th className="px-4 py-2 text-left text-blue-900">Reference</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-blue-200">
              <td className="px-4 py-3 text-blue-700">Jan 15, 2024</td>
              <td className="px-4 py-3 text-blue-700">Contract Review Service</td>
              <td className="px-4 py-3 text-blue-700">-$250.00</td>
              <td className="px-4 py-3">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">Completed</span>
              </td>
              <td className="px-4 py-3 text-blue-700">TXN-001</td>
            </tr>
            <tr className="border-b border-blue-200">
              <td className="px-4 py-3 text-blue-700">Jan 10, 2024</td>
              <td className="px-4 py-3 text-blue-700">Legal Consultation</td>
              <td className="px-4 py-3 text-blue-700">-$150.00</td>
              <td className="px-4 py-3">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">Completed</span>
              </td>
              <td className="px-4 py-3 text-blue-700">TXN-002</td>
            </tr>
            <tr className="border-b border-blue-200">
              <td className="px-4 py-3 text-blue-700">Feb 01, 2024</td>
              <td className="px-4 py-3 text-blue-700">Case Management Fee</td>
              <td className="px-4 py-3 text-blue-700">-$150.00</td>
              <td className="px-4 py-3">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">Pending</span>
              </td>
              <td className="px-4 py-3 text-blue-700">TXN-003</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200">
          Export Transactions
        </button>
      </div>
    </>
  );
}