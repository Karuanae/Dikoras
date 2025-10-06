import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerClients } from '../services/api';

export default function LawyerClients() {
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchClients() {
      try {
        const clientsData = await getLawyerClients();
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    }
    fetchClients();
  }, []);

  const handleContactClient = (client) => {
    // Find a case that connects this lawyer and client
    const sharedCase = clients.find(c => c.id === client.id)?.cases?.[0];
    if (sharedCase) {
      navigate(`/chat?case_id=${sharedCase.id}`);
    } else {
      alert('No shared case found with this client. You need to have an assigned case to chat.');
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Clients</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-3 text-blue-700">No clients found.</div>
        ) : (
          clients.map(client => (
            <div key={client.id} className="rounded-xl p-6 border shadow bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-blue-600">
                  {getInitials(client.name)}
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">{client.name}</h3>
                  <p className="text-blue-600 text-sm">{client.total_cases || 0} Cases</p>
                  <p className="text-blue-600 text-sm">{client.email}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-blue-700 text-sm">Active Cases: {client.active_cases || 0}</p>
                <p className="text-blue-700 text-sm">Phone: {client.phone || 'Not provided'}</p>
              </div>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm w-full"
                onClick={() => handleContactClient(client)}
              >
                Contact Client
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}