import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClientDashboard() {
  const [selectedService, setSelectedService] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const service = localStorage.getItem('selectedService');
    if (service) {
      setSelectedService(JSON.parse(service));
      localStorage.removeItem('selectedService');
    }
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

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Dashboard</h1>
      <p className="text-lg text-blue-700 mb-6">Welcome to Dikoras! Dikoras is the easiest solution for any client to get cost-effective and high quality legal services.</p>
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Post a Case */}
        <div className="flex items-center space-x-4">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="Post a Case" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Post a Case</h2>
            <p className="text-blue-700 text-sm">Get started by telling us about your legal needs. It only takes a minute and your information is strictly confidential.</p>
          </div>
        </div>
        {/* Get Proposals */}
        <div className="flex items-center space-x-4">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921223.png" alt="Get Proposals" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Get Proposals</h2>
            <p className="text-blue-700 text-sm">Our algorithm matches you with attorneys most qualified to handle your specific legal work. Review proposals and schedule free consultations.</p>
          </div>
        </div>
        {/* Hire your Lawyer */}
        <div className="flex items-center space-x-4 md:col-span-2">
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921224.png" alt="Hire your Lawyer" className="w-16 h-16" />
          <div>
            <h2 className="font-bold text-blue-900 text-lg mb-1">Hire your Lawyer</h2>
            <p className="text-blue-700 text-sm">When you're ready, instantly hire the attorney that's right for you.</p>
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
    </>
  );
}