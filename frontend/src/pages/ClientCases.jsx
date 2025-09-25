import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientCases, uploadDocumentWithFile, requestInvoice, exportTransactions } from '../services/api';

export default function ClientCases() {
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCases() {
      try {
        const casesData = await getClientCases();
        setCases(Array.isArray(casesData) ? casesData : []);
      } catch (err) {
        // Handle error
      }
    }
    fetchCases();
  }, []);

  const handleViewDetails = (caseId) => {
    navigate(`/client/cases/${caseId}`);
  };

  const handlePostNewCase = () => {
    navigate('/client/cases/new');
  };

  const getStatusColor = (status) => {
    if (["resolved", "completed", "closed"].includes(status)) return 'green';
    if (["pending", "open", "assigned", "in_progress"].includes(status)) return 'yellow';
    return 'blue';
  };

  // Handlers for new features
  const handleDocumentUpload = async (caseId) => {
    // For demo: prompt for file and upload
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
    // For demo: prompt for amount and description
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
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">My Cases</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.length === 0 ? (
          <div className="col-span-3 text-blue-700">No cases found.</div>
        ) : (
          cases.map(caseItem => {
            const statusColor = getStatusColor(caseItem.status);
            return (
              <div key={caseItem.id} className={`rounded-xl p-6 border shadow bg-${statusColor}-50 border-${statusColor}-200`}>
                <h3 className={`font-bold text-lg mb-2 text-${statusColor}-900`}>{caseItem.title}</h3>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Case #: {caseItem.case_number}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Service: {caseItem.legal_service || '-'}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Priority: {caseItem.priority || '-'}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Budget: {caseItem.budget ? `$${caseItem.budget}` : '-'}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Deadline: {caseItem.deadline ? new Date(caseItem.deadline).toLocaleDateString() : '-'}</p>
                <p className={`text-sm mb-4 text-${statusColor}-700`}>Status: {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}</p>
                <div className="flex flex-col gap-2">
                  <span className={`text-${statusColor}-600 text-sm`}>
                    {caseItem.lawyer && caseItem.lawyer.name ? `Assigned to: ${caseItem.lawyer.name}` : 'Awaiting assignment'}
                  </span>
                  <button 
                    className={`bg-${statusColor}-600 hover:bg-${statusColor}-700 text-white px-4 py-2 rounded-lg text-sm`}
                    onClick={() => handleViewDetails(caseItem.id)}
                  >
                    View Details
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
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
            );
          })
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handlePostNewCase}
        >
          Post New Case
        </button>
        <button
          className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handleExportTransactions}
        >
          Export Transactions
        </button>
      </div>
    </>
  );
}