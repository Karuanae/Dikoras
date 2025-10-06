import React, { useEffect, useState } from 'react';
import { getClientCases } from '../services/api';

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        // Fetch all client cases, then aggregate invoices from each case
        const cases = await getClientCases();
        let allInvoices = [];
        cases.forEach(c => {
          if (Array.isArray(c.invoices)) {
            allInvoices = allInvoices.concat(c.invoices.map(inv => ({
              ...inv,
              caseTitle: c.title,
              caseId: c.id
            })));
          }
        });
        setInvoices(allInvoices);
      } catch (err) {
        // Handle error
      }
    }
    fetchInvoices();
  }, []);

  const handleView = (invoice) => {
    // TODO: Implement view functionality (e.g., show modal with invoice details)
  };

  const handleDownload = (invoice) => {
    // If you have a download endpoint, use it here. Otherwise, show details.
    // window.open(`/api/invoices/${invoice.id}/download`, '_blank');
    alert('Download functionality not implemented.');
  };

  const handlePay = (invoice) => {
    // TODO: Implement payment functionality
  };

  const handleRequestInvoice = () => {
    // TODO: Implement request invoice functionality
  };

  const totalPaid = invoices.filter(inv => inv.status === 'paid' || inv.status === 'completed').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPending = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Invoices</h1>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-4 py-2 text-left text-blue-900">Invoice #</th>
              <th className="px-4 py-2 text-left text-blue-900">Date</th>
              <th className="px-4 py-2 text-left text-blue-900">Service</th>
              <th className="px-4 py-2 text-left text-blue-900">Amount</th>
              <th className="px-4 py-2 text-left text-blue-900">Status</th>
              <th className="px-4 py-2 text-left text-blue-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={7} className="text-blue-700 py-4">No invoices found.</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="border-b border-blue-200">
                  <td className="px-4 py-3 text-blue-700">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-blue-700">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-blue-700">{inv.caseTitle || '-'}</td>
                  <td className="px-4 py-3 text-blue-700">{typeof inv.total_amount === 'number' ? `$${inv.total_amount.toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`${
                      inv.status === 'paid' || inv.status === 'completed' ? 'bg-green-100 text-green-800' :
                      inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    } px-2 py-1 rounded-full text-sm`}>
                      {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-700">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 mr-2" onClick={() => handleView(inv)}>View</button>
                    {inv.status === 'paid' || inv.status === 'completed' ? (
                      <button className="text-green-600 hover:text-green-800" onClick={() => handleDownload(inv)}>Download</button>
                    ) : (
                      <button className="text-green-600 hover:text-green-800" onClick={() => handlePay(inv)}>Pay Now</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-8 flex justify-between items-center">
        <div>
          <p className="text-blue-700 font-semibold">Total Paid: ${totalPaid.toFixed(2)}</p>
          <p className="text-blue-700">Pending: ${totalPending.toFixed(2)}</p>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200" onClick={handleRequestInvoice}>
          Request Invoice
        </button>
      </div>
    </>
  );
}