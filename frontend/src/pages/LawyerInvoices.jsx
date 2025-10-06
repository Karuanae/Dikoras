import React, { useEffect, useState } from 'react';
import { getLawyerInvoices } from '../services/api';

export default function LawyerInvoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const data = await getLawyerInvoices();
        setInvoices(data);
      } catch (err) {
        // Handle error
      }
    }
    fetchInvoices();
  }, []);

  const handleView = (invoice) => {
    // TODO: Implement view functionality
  };

  const handleDownload = (invoice) => {
    window.open(invoice.downloadUrl, '_blank');
  };

  const handleSendReminder = (invoice) => {
    // TODO: Implement send reminder functionality
  };

  const handleCreateInvoice = () => {
    // TODO: Implement create invoice functionality
  };

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
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="text-blue-700 py-4">No invoices found.</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="border-b border-blue-200">
                  <td className="px-4 py-3 text-blue-700">{inv.number}</td>
                  <td className="px-4 py-3 text-blue-700">{inv.client}</td>
                  <td className="px-4 py-3 text-blue-700">{inv.service}</td>
                  <td className="px-4 py-3 text-blue-700">${inv.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`${
                      inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                      inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    } px-2 py-1 rounded-full text-sm`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 mr-2" onClick={() => handleView(inv)}>View</button>
                    {inv.status === 'paid' ? (
                      <button className="text-green-600 hover:text-green-800" onClick={() => handleDownload(inv)}>Download</button>
                    ) : (
                      <button className="text-green-600 hover:text-green-800" onClick={() => handleSendReminder(inv)}>Send Reminder</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-8">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200" onClick={handleCreateInvoice}>
          Create New Invoice
        </button>
      </div>
    </>
  );
}