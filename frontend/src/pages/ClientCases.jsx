import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases } from '../services/api';

export default function ClientCases() {
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCases() {
      try {
        const casesData = await getCases();
        setCases(casesData);
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

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">My Cases</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.length === 0 ? (
          <div className="col-span-3 text-blue-700">No cases found.</div>
        ) : (
          cases.map(caseItem => {
            // Map status to color
            let statusColor = 'blue';
            if (["resolved", "completed"].includes(caseItem.status)) statusColor = 'green';
            else if (["pending", "open"].includes(caseItem.status)) statusColor = 'yellow';

            return (
              <div key={caseItem.id} className={`rounded-xl p-6 border shadow bg-${statusColor}-50 border-${statusColor}-200`}>
                <h3 className={`font-bold text-lg mb-2 text-${statusColor}-900`}>{caseItem.title}</h3>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Case #: {caseItem.case_number}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Service: {caseItem.legal_service || '-'}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Priority: {caseItem.priority || '-'}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Budget: {caseItem.budget ? `$${caseItem.budget}` : '-'}</p>
                <p className={`text-sm mb-1 text-${statusColor}-700`}>Deadline: {caseItem.deadline ? new Date(caseItem.deadline).toLocaleDateString() : '-'}</p>
                <p className={`text-sm mb-4 text-${statusColor}-700`}>Status: {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-${statusColor}-600 text-sm`}>
                    {caseItem.lawyer_name ? `Assigned to: ${caseItem.lawyer_name}` : 'Awaiting assignment'}
                  </span>
                  <button 
                    className={`bg-${statusColor}-600 hover:bg-${statusColor}-700 text-white px-4 py-2 rounded-lg text-sm`}
                    onClick={() => handleViewDetails(caseItem.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          onClick={handlePostNewCase}
        >
          Post New Case
        </button>
      </div>
    </>
  );
}