import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerCases } from '../services/api';

export default function LawyerCases() {
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCases() {
      try {
        const casesData = await getLawyerCases();
        setCases(casesData);
      } catch (err) {
        // Handle error
      }
    }
    fetchCases();
  }, []);

  const handleViewDetails = (caseId) => {
    navigate(`/lawyer/cases/${caseId}`);
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">My Cases</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.length === 0 ? (
          <div className="col-span-3 text-blue-700">No cases found.</div>
        ) : (
          cases.map(caseItem => (
            <div key={caseItem.id} className={`rounded-xl p-6 border shadow ${
              caseItem.status === 'completed' ? 'bg-green-50 border-green-200' :
              caseItem.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`font-bold text-lg mb-2 ${
                caseItem.status === 'completed' ? 'text-green-900' :
                caseItem.status === 'pending' ? 'text-yellow-900' :
                'text-blue-900'
              }`}>{caseItem.title}</h3>
              <p className={`text-sm mb-4 ${
                caseItem.status === 'completed' ? 'text-green-700' :
                caseItem.status === 'pending' ? 'text-yellow-700' :
                'text-blue-700'
              }`}>Status: {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}</p>
              <p className={`${
                caseItem.status === 'completed' ? 'text-green-600' :
                caseItem.status === 'pending' ? 'text-yellow-600' :
                'text-blue-600'
              } text-sm mb-4`}>Client: {caseItem.client}</p>
              <div className="flex justify-between items-center">
                <span className={`${
                  caseItem.status === 'completed' ? 'text-green-600' :
                  caseItem.status === 'pending' ? 'text-yellow-600' :
                  'text-blue-600'
                } text-sm`}>
                  {caseItem.dueDate ? `Due: ${caseItem.dueDate}` : caseItem.completedDate ? `Completed: ${caseItem.completedDate}` : caseItem.submittedDate ? `Submitted: ${caseItem.submittedDate}` : ''}
                </span>
                <button 
                  className={`${
                    caseItem.status === 'completed' ? 'bg-green-600 hover:bg-green-700' :
                    caseItem.status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg text-sm`}
                  onClick={() => handleViewDetails(caseItem.id)}
                >
                  {caseItem.status === 'pending' ? 'Review' : 'View Details'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}