import React from 'react';

export default function LawyerInvoices() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Invoices</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-4 py-2 text-left text-blue-900">Invoice #</th>
              <th className="px-4 py-2 text-left text-blue-900">Client</th>
              <th className="px-4 py-2 text-left text-blue-900">Service</th>
              <th className="px-4 py-2 text-left text-blue-900">Amount</th>
              <th className="px-4 py-2 text-left text-blue-900">Status</th>
              <th className="px-4 py-2 text-left text-blue-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-blue-200">
              <td className="px-4 py-3 text-blue-700">INV-001</td>
              <td className="px-4 py-3 text-blue-700">John Smith</td>
              <td className="px-4 py-3 text-blue-700">Contract Review</td>
              <td className="px-4 py-3 text-blue-700">$250.00</td>
              <td className="px-4 py-3">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">Paid</span>
              </td>
              <td className="px-4 py-3">
                <button className="text-blue-600 hover:text-blue-800 mr-2">View</button>
                <button className="text-green-600 hover:text-green-800">Download</button>
              </td>
            </tr>
            <tr className="border-b border-blue-200">
              <td className="px-4 py-3 text-blue-700">INV-002</td>
              <td className="px-4 py-3 text-blue-700">Sarah Johnson</td>
              <td className="px-4 py-3 text-blue-700">Divorce Case</td>
              <td className="px-4 py-3 text-blue-700">$1,200.00</td>
              <td className="px-4 py-3">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">Pending</span>
              </td>
              <td className="px-4 py-3">
                <button className="text-blue-600 hover:text-blue-800 mr-2">View</button>
                <button className="text-green-600 hover:text-green-800">Send Reminder</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200">
          Create New Invoice
        </button>
      </div>
    </>
  );
}