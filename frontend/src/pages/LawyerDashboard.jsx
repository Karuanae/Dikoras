import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLawyerCases,
  getLawyerClients,
  getLawyerMessages,
  uploadDocumentWithFile,
  requestInvoice,
  exportTransactions
} from '../services/api';

export default function LawyerDashboard() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        const casesData = await getLawyerCases();
        setCases(Array.isArray(casesData) ? casesData : []);
        const clientsData = await getLawyerClients();
        setClients(clientsData.length);
        const messagesData = await getLawyerMessages();
        setUnreadMessages(messagesData.unreadCount || 0);
      } catch (err) {
        // Handle error
      }
    }
    fetchStats();
  }, []);

  const handleAddCase = () => {
    navigate('/lawyer/cases/new');
  };

  const handleManageClients = () => {
    navigate('/lawyer/clients');
  };

  const handleViewMessages = () => {
    navigate('/lawyer/messages');
  };

  const handleViewCases = () => {
    navigate('/lawyer/cases');
  };

  // New handlers for improvements
  const handleDocumentUpload = async (caseId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await uploadDocumentWithFile({ case_id: caseId, file });
        alert('Document uploaded!');
      } catch (err) {
        alert('Upload failed: ' + (err.response?.data?.error || err.message));
      }
    };
    fileInput.click();
  };

  const handleRequestInvoice = async (caseId) => {
    const amount = prompt('Enter invoice amount:');
    const description = prompt('Enter invoice description:');
    if (!amount || !description) return;
    try {
      await requestInvoice({ case_id: caseId, amount, description });
      alert('Invoice requested!');
    } catch (err) {
      alert('Invoice request failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExportTransactions = () => {
    exportTransactions();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Lawyer Dashboard</h1>
      <p className="text-lg text-blue-700 mb-6">Welcome to your dashboard. Here you can manage your cases, clients, and profile.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cases.length === 0 ? (
          <div className="col-span-3 text-blue-700">No cases found.</div>
        ) : (
          cases.map(caseItem => (
            <div key={caseItem.id} className="rounded-xl p-6 border shadow bg-blue-50 border-blue-200">
              <h3 className="font-bold text-lg mb-2 text-blue-900">{caseItem.title}</h3>
              <p className="text-sm mb-1 text-blue-700">Case #: {caseItem.case_number}</p>
              <p className="text-sm mb-1 text-blue-700">Service: {caseItem.legal_service || '-'}</p>
              <p className="text-sm mb-1 text-blue-700">Priority: {caseItem.priority || '-'}</p>
              <p className="text-sm mb-1 text-blue-700">Budget: {caseItem.budget ? `$${caseItem.budget}` : '-'}</p>
              <p className="text-sm mb-1 text-blue-700">Deadline: {caseItem.deadline ? new Date(caseItem.deadline).toLocaleDateString() : '-'}</p>
              <p className="text-sm mb-4 text-blue-700">Status: {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}</p>
              <div className="flex flex-col gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  onClick={() => handleDocumentUpload(caseItem.id)}
                >
                  Upload Document
                </button>
                <button
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                  onClick={() => handleRequestInvoice(caseItem.id)}
                >
                  Request Invoice
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handleAddCase}
        >
          Add New Case
        </button>
        <button
          className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handleExportTransactions}
        >
          Export Transactions
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handleManageClients}
        >
          Manage Clients
        </button>
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handleViewMessages}
        >
          View Messages
        </button>
        <button
          className="bg-blue-400 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handleViewCases}
        >
          View All Cases
        </button>
      </div>
    </div>
  );
}