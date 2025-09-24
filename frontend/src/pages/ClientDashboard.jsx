import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Client Dashboard Component
export default function ClientDashboard() {
  const [selectedService, setSelectedService] = useState(null);
  const [activeCases, setActiveCases] = useState(3);
  const [messages, setMessages] = useState(2);
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load data from localStorage or API
    const service = localStorage.getItem('selectedService');
    const savedCases = JSON.parse(localStorage.getItem('clientCases') || '[]');
    const messageCount = parseInt(localStorage.getItem('unreadMessages') || '2');
    
    if (service) {
      setSelectedService(JSON.parse(service));
      localStorage.removeItem('selectedService');
    }
    
    setCases(savedCases);
    setActiveCases(savedCases.filter(caseItem => caseItem.status === 'active').length);
    setMessages(messageCount);
  }, []);

  const handlePostCase = () => {
    if (selectedService) {
      navigate('/client/cases/new', { 
        state: { preselectedService: selectedService } 
      });
    } else {
      navigate('/client/cases/new');
    }
  };

  const handleViewCases = () => {
    navigate('/client/cases');
  };

  const handleViewMessages = () => {
    navigate('/client/messages');
    // Reset unread messages counter
    setMessages(0);
    localStorage.setItem('unreadMessages', '0');
  };

  const handleFindLawyers = () => {
    navigate('/client/lawyers');
  };

  const handleHireLawyer = (caseId) => {
    // In a real app, this would call an API to hire a lawyer for a specific case
    const updatedCases = cases.map(c => 
      c.id === caseId ? {...c, status: 'lawyer-hired', hired: true} : c
    );
    setCases(updatedCases);
    localStorage.setItem('clientCases', JSON.stringify(updatedCases));
    setActiveCases(updatedCases.filter(caseItem => caseItem.status === 'active' || caseItem.status === 'lawyer-hired').length);
    alert('Lawyer hired successfully!');
  };

  // Sample case data - in a real app, this would come from an API
  const sampleCases = [
    { id: 1, title: 'Divorce Proceedings', type: 'Family Law', status: 'active', proposals: 3 },
    { id: 2, title: 'Business Contract Review', type: 'Corporate Law', status: 'proposals-received', proposals: 5 },
    { id: 3, title: 'Property Dispute', type: 'Real Estate', status: 'active', proposals: 2 },
  ];

  // Initialize cases if none exist
  useEffect(() => {
    if (cases.length === 0) {
      const storedCases = JSON.parse(localStorage.getItem('clientCases') || '[]');
      if (storedCases.length === 0) {
        localStorage.setItem('clientCases', JSON.stringify(sampleCases));
        setCases(sampleCases);
      }
    }
  }, [cases]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Dashboard</h1>
      <p className="text-lg text-blue-700 mb-6">Welcome to Dikoras! Dikoras is the easiest solution for any client to get cost-effective and high quality legal services.</p>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">{activeCases}</span>
          <span className="text-blue-900 font-semibold">Active Cases</span>
          <button 
            onClick={handleViewCases}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            View All
          </button>
        </div>
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">{cases.filter(c => c.hired).length || 5}</span>
          <span className="text-blue-900 font-semibold">Lawyers Hired</span>
        </div>
        <div className="bg-blue-50 rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-700 mb-2">{messages}</span>
          <span className="text-blue-900 font-semibold">Unread Messages</span>
          <button 
            onClick={handleViewMessages}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            View Messages
          </button>
        </div>
      </div>
      
      {selectedService && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Continue with your selected service:</h3>
          <p className="text-blue-700">{selectedService.title}</p>
          <button 
            onClick={handlePostCase}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue with {selectedService.title}
          </button>
        </div>
      )}
      
      {/* Recent Cases Section */}
      {cases.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Your Recent Cases</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-3 text-left text-blue-900">Case Title</th>
                  <th className="p-3 text-left text-blue-900">Type</th>
                  <th className="p-3 text-left text-blue-900">Status</th>
                  <th className="p-3 text-left text-blue-900">Proposals</th>
                  <th className="p-3 text-left text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 3).map(caseItem => (
                  <tr key={caseItem.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{caseItem.title}</td>
                    <td className="p-3">{caseItem.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        caseItem.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                        caseItem.status === 'proposals-received' ? 'bg-blue-100 text-blue-800' :
                        caseItem.status === 'lawyer-hired' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {caseItem.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-3">{caseItem.proposals}</td>
                    <td className="p-3">
                      {caseItem.status === 'proposals-received' && !caseItem.hired ? (
                        <button 
                          onClick={() => handleHireLawyer(caseItem.id)}
                          className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-1 px-3 rounded"
                        >
                          Hire Lawyer
                        </button>
                      ) : (
                        <button 
                          onClick={handleViewCases}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleViewCases}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Cases →
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Post a Case */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Post a Case" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Post a Case</h2>
            <p className="text-blue-700 text-sm">Get started by telling us about your legal needs. It only takes a minute and your information is strictly confidential.</p>
            <button 
              onClick={handlePostCase}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
            >
              Post a Case
            </button>
          </div>
        </div>
        {/* Get Proposals */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921223.png" alt="Get Proposals" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Get Proposals</h2>
            <p className="text-blue-700 text-sm">Our algorithm matches you with attorneys most qualified to handle your specific legal work. Review proposals and schedule free consultations.</p>
            <button 
              onClick={handleViewCases}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
            >
              View Proposals
            </button>
          </div>
        </div>
        {/* Hire your Lawyer */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow md:col-span-2">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921224.png" alt="Hire your Lawyer" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Hire your Lawyer</h2>
            <p className="text-blue-700 text-sm">When you're ready, instantly hire the attorney that's right for you.</p>
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={handleFindLawyers}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded"
              >
                Find Lawyers
              </button>
              <button 
                onClick={handleViewMessages}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded"
              >
                Message Lawyers
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <button 
          onClick={handlePostCase}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
        >
          Post a Case & Get Free Proposals
        </button>
      </div>
    </div>
  );
}